const axios = require('axios');

module.exports = {
  config: {
    name: "pin",
    aliases: [],
    version: "1.0",
    author: "YourName",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Pinterest image search"
    },
    longDescription: {
      en: "Search Pinterest and return 4 random images"
    },
    category: "image",
    guide: {
      en: "{pn} <search text>"
    }
  },

  onStart: async function ({ api, event, args }) {
    const query = args.join(" ");
    if (!query) return api.sendMessage("Please provide a search term.", event.threadID, event.messageID);

    try {
      const res = await axios.get(`https://alit-x-api.onrender.com/api/pin?query=${encodeURIComponent(query)}`);
      const data = res.data;

      if (!data.images || data.images.length === 0) {
        return api.sendMessage("No images found.", event.threadID, event.messageID);
      }

      // Shuffle and pick 4 random images
      const shuffled = data.images.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 4);

      // Download images as buffers
      const attachments = await Promise.all(
        selected.map(async (url) => {
          const img = await axios.get(url, { responseType: "arraybuffer" });
          return Buffer.from(img.data, "binary");
        })
      );

      api.sendMessage({
        body: `Pinterest search "${query}"`,
        attachment: attachments
      }, event.threadID, event.messageID);

    } catch (err) {
      console.error(err);
      api.sendMessage("Error occurred while fetching data.", event.threadID, event.messageID);
    }
  }
};