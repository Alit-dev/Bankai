const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

const DATA_DIR = path.join(__dirname, "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const activeUsers = {};

function getFilePath(uid) {
  return path.join(DATA_DIR, `${uid}.json`);
}

function loadHistory(uid) {
  const file = getFilePath(uid);
  if (!fs.existsSync(file)) return [];
  const raw = JSON.parse(fs.readFileSync(file));
  const now = Date.now();
  return raw.filter(item => now - item.time < 6 * 60 * 60 * 1000);
}

function saveMessage(uid, role, content) {
  const file = getFilePath(uid);
  const history = loadHistory(uid);
  history.push({ role, content, time: Date.now() });
  fs.writeFileSync(file, JSON.stringify(history, null, 2));
}

function listDataFiles() {
  return fs.readdirSync(DATA_DIR).filter(f => f.endsWith(".json"));
}

module.exports = {
  config: {
    name: "ai",
    version: "2.0",
    author: "Seba AI",
    role: 0,
    shortDescription: "স্মার্ট বাংলা স্বাস্থ্য সহকারী",
    longDescription: "বাংলায় কথা বলার মাধ্যমে রোগ বুঝে ওষুধ বা পরামর্শ দেয়।",
    category: "health",
    guide: "help, bot, doc, susastho বা subot লিখে শুরু করুন"
  },

  onStart: async function () {},

  onChat: async function ({ event, message, api }) {
    const input = event.body?.trim();
    const uid = event.senderID;
    const msgID = event.messageID;

    if (!input) return;

    // Admin Data Control
    if (input === "dataclear?pass=alit") {
      const file = getFilePath(uid);
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        return message.reply("✅ আপনার তথ্য মুছে ফেলা হয়েছে।");
      } else return message.reply("আপনার কোনো তথ্য পাওয়া যায়নি।");
    }

    if (input === "datashow?pass=alit") {
      const files = listDataFiles();
      if (files.length === 0) return message.reply("কোনো ডেটা নেই।");
      let msg = "সেভ হওয়া ব্যবহারকারীর তালিকা:\n\n";
      files.forEach((f, i) => msg += `${i + 1}. ${f.replace(".json", "")}\n`);
      activeUsers[uid] = { mode: "viewFiles", files };
      return message.reply(msg + "\n\nযেকোনো নম্বর reply দিন দেখতে চাইলে।");
    }

    if (/^\.?datadl\?(\d+)pass=alit$/.test(input)) {
      const num = parseInt(input.match(/^\.?datadl\?(\d+)pass=alit$/)[1]) - 1;
      const files = listDataFiles();
      if (!files[num]) return message.reply("ভুল নম্বর।");
      fs.unlinkSync(path.join(DATA_DIR, files[num]));
      return message.reply(`✅ ফাইল ${files[num]} মুছে ফেলা হয়েছে।`);
    }

    if (activeUsers[uid]?.mode === "viewFiles" && !isNaN(input)) {
      const idx = parseInt(input) - 1;
      const file = activeUsers[uid].files[idx];
      if (!file) return message.reply("ভুল নম্বর।");
      const data = fs.readFileSync(path.join(DATA_DIR, file), "utf-8");
      delete activeUsers[uid];
      return message.reply(`ফাইল ${file}:\n\n${data}`);
    }

    // Ignore punctuation-only input
    if (/^[.!*?#/+=@%^&()_{}<>\\|:;"'~`]/.test(input)) return;

    // Trigger bot only if input matches exactly one of these
    const triggers = ["help","doctor"];
    if (triggers.includes(input.toLowerCase())) {
      const reply = await message.reply("হ্যালো! আপনি কেমন আছেন? আমার প্রশ্নের উত্তর দিন যেন আমি আপনার সাহায্য করতে পারি।");
      activeUsers[uid] = { active: true, msgID: reply.messageID };
      return;
    }

    if (activeUsers[uid]?.active) {
      const expectedReplyTo = activeUsers[uid].msgID;
      if (event.messageReply && event.messageReply.messageID === expectedReplyTo) {
        saveMessage(uid, "user", input);
        api.setMessageReaction("⌛", msgID, () => {}, true);

        const history = loadHistory(uid).map(m => ({
          role: m.role,
          content: m.content
        }));

        history.unshift({
          role: "system",
          content: "তুমি একজন মানবিক স্বাস্থ্য সহকারী। রোগীর সমস্যা বুঝে ছোট ছোট প্রশ্ন করে তথ্য সংগ্রহ করো। সবকিছু বাংলায় বলো এবং শেষে সমস্যার সম্ভাব্য কারণ, ঘরোয়া সমাধান, ওষুধ (যদি প্রয়োজন হয়) পরামর্শ দাও।"
        });

        try {
          const res = await axios.post("https://api.together.xyz/v1/chat/completions", {
            model: "deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free",
            messages: history,
            max_tokens: 1000,
            temperature: 0.7
          }, {
            headers: {
              Authorization: "Bearer 1d656f6f282fc0ac7a67bf2af85d2c0ebce17145d19e7d7e3faf6ea3dc864b07",
              "Content-Type": "application/json"
            }
          });

          let reply = res.data.choices[0].message.content.trim();
          reply = reply.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

          saveMessage(uid, "assistant", reply);
          api.setMessageReaction("✅", msgID, () => {}, true);
          const sent = await message.reply(reply);
          activeUsers[uid].msgID = sent.messageID;

        } catch (err) {
          console.error("Health Bot Error:", err);
          api.setMessageReaction("❌", msgID, () => {}, true);
          message.reply("দুঃখিত, কিছু ভুল হয়েছে। পরে আবার চেষ্টা করুন।");
        }
      } else {
        // bot এর উত্তর ছাড়া অন্য কিছু বললে বন্ধ করে দাও
        delete activeUsers[uid];
        api.setMessageReaction("👋", msgID, () => {}, true);
      }
    }
  }
};