const axios = require("axios");

module.exports = {
  config: {
    name: "edit",
    aliases: [],
    version: "1.0",
    author: "Alamin",
    countDown: 2,
    role: 0,
    shortDescription: {
      en: "Edit image with prompt (reply only)"
    },
    longDescription: {
      en: "Reply to an image and provide a prompt to edit it using AI."
    },
    category: "image",
    guide: {
      en: "{p}edit <prompt> → Reply to an image and give instruction to edit it."
    }
  },

  onStart: async function ({ message, event, args, api }) {
    const prompt = args.join(" ");
    if (!prompt) return message.reply("Please provide a prompt for image editing.");
    if (!event.messageReply || !event.messageReply.attachments || event.messageReply.attachments.length === 0)
      return message.reply("Please reply to an image.");

    const attachment = event.messageReply.attachments[0];
    if (attachment.type !== "photo") return message.reply("Please reply to a photo only.");

    // React with ⏳
    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    try {
      const imgUrl = attachment.url;
      const apiUrl = `https://api-new-dxgd.onrender.com/edit?prompt=${encodeURIComponent(prompt)}&url=${encodeURIComponent(imgUrl)}`;

      const res = await axios.get(apiUrl);
      const imageUrl = res.data.imageUrl;

      if (!imageUrl) return message.reply("No image returned from API.");

      // Send image
      message.reply({
        body: "",
        attachment: await global.utils.getStreamFromURL(imageUrl)
      });

      // React with ✅
      api.setMessageReaction("✅", event.messageID, () => {}, true);

    } catch (err) {
      console.error(err);
      message.reply("Image edit failed.");
      api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
  }
};