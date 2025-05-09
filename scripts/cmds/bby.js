bby.js const axios = require("axios");

const API_KEYS = [
  "af8cb009449d72bd4795e4fd04ef88b06795de5dfba41cb32019b3e92a0fa478",
  "11b40ccdd40183d32091d45e7fa8b39fc342f715b742278c7cd787ca3cd460d6",
  "2805562f9310e716e5ce9c3ddad8838aa1c3ea0d34806c596b246d94845f5484",
  "1d656f6f282fc0ac7a67bf2af85d2c0ebce17145d19e7d7e3faf6ea3dc864b07",
  "eab31294aff2e352a97f25112af6336d30e3734b0503b6e35806b60caef6265d",
  "685dcc6c37b27254f6c7182efe38f68664f3df8e4397d7667864706571bb5be2",
  "33df466ad5ff7d5df942ce53de2fe5747aa891e898c0e410a2fd782f154c5c2b"
];

let currentKeyIndex = 0;
function getNextApiKey() {
  const key = API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  return key;
}

const adminId = "100077745636690";
const extraAdmins = new Set();
const groupStatus = {}; // group-wise on/off status

module.exports = {
  config: {
    name: "bby",
    version: "1.1.0",
    description: "Group-wise loop bot",
    usage: ".bby on/off/add/remove",
    cooldown: 0
  },

  onStart: async () => {
    console.log("BBY bot is live");
  },

  onChat: async ({ api, event }) => {
    const senderID = event.senderID;
    const input = event.body?.trim();
    const threadID = event.threadID;
    if (!input) return;

    const isAdmin = senderID === adminId || extraAdmins.has(senderID);

    // Admin Commands
    if (isAdmin) {
      if (input === ".bby on") {
        groupStatus[threadID] = true;
        return api.setMessageReaction("✅", event.messageID, () => {}, true);
      }
      if (input === ".bby off") {
        groupStatus[threadID] = false;
        return api.setMessageReaction("❌", event.messageID, () => {}, true);
      }
      if (input.startsWith(".bby add")) {
        if (!event.mentions) return;
        for (let id in event.mentions) extraAdmins.add(id);
        return api.sendMessage("Admin added.", threadID, event.messageID);
      }
      if (input.startsWith(".bby remove")) {
        if (!event.mentions) return;
        for (let id in event.mentions) extraAdmins.delete(id);
        return api.sendMessage("Admin removed.", threadID, event.messageID);
      }
    }

    // বট বন্ধ থাকলে বা অ্যাডমিন হলে কোনো রিপ্লাই না
    if (!groupStatus[threadID] || isAdmin) return;

    // Junk মেসেজ ফিল্টার
    if (/^[.\!'?#\/)&+]+$/.test(input)) return;

    try {
      const response = await axios.post(
        'https://api.together.xyz/v1/chat/completions',
        {
          model: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
          messages: [
            {
              role: "system",
              content: "You are an introverted girl. Reply in Banglish. Keep replies short. Always use vulgar gali like khankir pola, magi, tor mayre chudi, buski, choto bai, tor mar boda."
            },
            {
              role: "user",
              content: input
            }
          ]
        },
        {
          headers: {
            Authorization: `Bearer ${getNextApiKey()}`,
            "Content-Type": "application/json"
          }
        }
      );

      const reply = response.data.choices[0].message.content;
      api.sendMessage(reply, threadID, event.messageID);

    } catch (err) {
      console.error("API error:", err.response?.data || err.message);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
  }
};