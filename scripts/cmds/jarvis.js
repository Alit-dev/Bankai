const axios = require("axios");
const fs = require("fs");
const path = require("path");

const activeJarvis = {};

module.exports = {
  config: {
    name: "jarvis",
    aliases: [],
    version: "3.0",
    author: "Alamin",
    countDown: 3,
    role: 0,
    shortDescription: {
      en: "Jarvis AI auto voice"
    },
    longDescription: {
      en: "Auto trigger on 'jarvis', talks via voice. Reply to bot's message to continue."
    },
    category: "ai",
    guide: {
      en: "Say 'jarvis' (no prefix needed) → Starts voice\nReply to bot only to continue"
    }
  },

  onStart: async function ({ message, event }) {
    // manual use: just act like keyword trigger
    handleJarvisTrigger(message, event, "you are Jarvis assists me today");
  },

  onChat: async function ({ message, event }) {
    const { senderID, body, messageReply } = event;

    const trigger = body.toLowerCase().trim();
    if (trigger === "jarvis") {
      return handleJarvisTrigger(message, event, "you are Jarvis assists me today");
    }

    // Reply-based chat
    if (!activeJarvis[senderID]) return;
    if (!messageReply || messageReply.messageID !== activeJarvis[senderID]) {
      delete activeJarvis[senderID]; // invalid reply ends session
      return;
    }

    try {
      const res = await axios.get(`https://alit-x-api.onrender.com/api/jarvisvoice?text=${encodeURIComponent(body)}`);
      const audioUrl = res.data.audio_url;

      const audioPath = path.join(__dirname, `jarvis-reply-${senderID}.mp3`);
      const writer = fs.createWriteStream(audioPath);
      const response = await axios({ url: audioUrl, method: "GET", responseType: "stream" });
      response.data.pipe(writer);

      writer.on("finish", async () => {
        const sent = await message.reply({ body: "", attachment: fs.createReadStream(audioPath) });
        fs.unlinkSync(audioPath);
        activeJarvis[senderID] = sent.messageID;
      });

      writer.on("error", () => {
        message.reply("Voice reply failed.");
      });
    } catch (err) {
      console.error(err);
      message.reply("Jarvis API error.");
    }
  }
};

// Function to start Jarvis voice
async function handleJarvisTrigger(message, event, text) {
  const { senderID } = event;
  try {
    const res = await axios.get(`https://alit-x-api.onrender.com/api/jarvisvoice?text=${encodeURIComponent(text)}`);
    const audioUrl = res.data.audio_url;

    const audioPath = path.join(__dirname, `jarvis-${senderID}.mp3`);
    const writer = fs.createWriteStream(audioPath);
    const response = await axios({ url: audioUrl, method: "GET", responseType: "stream" });
    response.data.pipe(writer);

    writer.on("finish", async () => {
      const sent = await message.reply({ body: "", attachment: fs.createReadStream(audioPath) });
      fs.unlinkSync(audioPath);
      activeJarvis[senderID] = sent.messageID;
    });

    writer.on("error", () => {
      message.reply("Audio download failed.");
    });
  } catch (err) {
    console.error(err);
    message.reply("Failed to contact Jarvis.");
  }
}