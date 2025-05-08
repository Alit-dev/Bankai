const axios = require("axios");

module.exports = {
  config: {
    name: "flux",
    aliases: [],
    version: "1.0",
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

    // React with ⏳ (waiting) when command is first received
    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    try {
      const apiUrl = `https://api-new-dxgd.onrender.com/flux?prompt=${encodeURIComponent(prompt)}`;
      const res = await axios.get(apiUrl);

      const imageUrl = res.data.imageUrl;
      if (!imageUrl) return message.reply("No image received from API.");

      // Send the image back to the user
      await message.reply({
        body: "",
        attachment: await global.utils.getStreamFromURL(imageUrl)
      });

      // React with ✅ (done) after receiving the image
      api.setMessageReaction("✅", event.messageID, () => {}, true);

    } catch (err) {
      console.error(err);
      message.reply("Failed to generate image.");
      
      // React with ❌ if there's an error
      api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
  }
};