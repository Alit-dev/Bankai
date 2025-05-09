const axios = require("axios");

module.exports = {
  config: {
    name: "fluxulta",
    aliases: ["fluxu","flux u],
    version: "2.0",
    author: "Alamin",
    countDown: 2,
    role: 0,
    shortDescription: {
      en: "Generate AI image from prompt via FluxUltra"
    },
    longDescription: {
      en: "Type {p}flux <text> to generate AI image using FluxUltra API"
    },
    category: "ai",
    guide: {
      en: "{p}flux <prompt>"
    }
  },

  onStart: async function ({ message, event, args, api }) {
    const prompt = args.join(" ");
    if (!prompt) return message.reply("Please provide a prompt to generate image.");

    // React with ⏳ while waiting
    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    try {
      const apiUrl = `https://renzweb.onrender.com/api/fluxultra?prompt=${encodeURIComponent(prompt)}`;

      const res = await axios.get(apiUrl, {
        responseType: "stream" // Since it returns image directly
      });

      await message.reply({
        body: "",
        attachment: res.data
      });

      // ✅ when done
      api.setMessageReaction("✅", event.messageID, () => {}, true);

    } catch (err) {
      console.error(err);
      message.reply("Failed to generate image.");
      api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
  }
};