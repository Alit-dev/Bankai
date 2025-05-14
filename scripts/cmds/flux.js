const axios = require("axios");

module.exports = {
  config: {
    name: "fluxulta",
    aliases: ["f"],
    version: "1.1",
    author: "Alamin",
    countDown: 2,
    role: 0,
    shortDescription: {
      en: "Generate AI image from prompt via Flux"
    },
    longDescription: {
      en: "Type {p}flux <text> to generate AI image using Flux API"
    },
    category: "ai",
    guide: {
      en: "{p}flux <prompt>"
    }
  },

  onStart: async function ({ message, event, args, api }) {
    const prompt = args.join(" ");
    if (!prompt) return message.reply("Please provide a prompt to generate image.");

    const startTime = Date.now();
    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    try {
      const apiUrl = `https://alit-x-api.onrender.com/api/fluxv2?prompt=${encodeURIComponent(prompt)}`;
      const res = await axios.get(apiUrl);

      const imageUrl = res.data.url;
      if (!imageUrl) return message.reply("No image received from API.");

      const endTime = Date.now();
      const timeTaken = ((endTime - startTime) / 1000).toFixed(2);

      await message.reply({
        body: `✨ | Here is your image ..!!\n⏱️ Took: ${timeTaken} seconds`,
        attachment: await global.utils.getStreamFromURL(imageUrl)
      });

      api.setMessageReaction("✅", event.messageID, () => {}, true);

    } catch (err) {
      console.error(err);
      message.reply("Failed to generate image.");
      api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
  }
};