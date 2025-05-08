const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "autodll",
    version: "2.1",
    author: "AlaminX",
    countDown: 0,
    role: 0,
    shortDescription: "Auto download videos from media links",
    longDescription: "Detects video links and replies with downloaded file and time taken",
    category: "media",
    guide: "{pn}"
  },

  onStart: async () => {},

  onChat: async function ({ event, message, api }) {
    const { body, threadID, messageID } = event;
    if (!body) return;

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = body.match(urlRegex);
    if (!matches) return;

    for (const url of matches) {
      if (/\.(jpg|jpeg|png|gif|webp)$/i.test(url)) continue;

      if (/tiktok\.com|facebook\.com|fb\.watch|youtube\.com|youtu\.be|instagram\.com|dailymotion\.com/i.test(url)) {
        const startTime = Date.now();

        api.setMessageReaction("💭", messageID, () => {}, true);

        try {
          const apiUrl = `https://api-new-dxgd.onrender.com/download?url=${encodeURIComponent(url)}`;
          const res = await axios.get(apiUrl);
          const data = res.data;

          if (!data || !data.url) {
            return message.reply("❌ ভিডিও URL পাওয়া যায়নি।");
          }

          const titleMatch = data.title?.match(/[\u0900-\u09FF\u0600-\u06FF\u0E00-\u0E7F\u3040-\u309F\u4E00-\u9FFF\uAC00-\uD7AFa-zA-Z0-9\s\p{Emoji_Presentation}]+/gu);
          const cleanedTitle = titleMatch ? titleMatch.join(" ").trim() : "Unknown Title";

          const videoUrl = data.url;
          const folderPath = path.join(__dirname, "caches");
          const fileName = `video_${Date.now()}.mp4`;
          const filePath = path.join(folderPath, fileName);

          if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath);

          const videoStream = await axios({
            url: videoUrl,
            method: "GET",
            responseType: "stream"
          });

          const writer = fs.createWriteStream(filePath);
          videoStream.data.pipe(writer);

          writer.on("finish", async () => {
            const endTime = Date.now();
            const duration = ((endTime - startTime) / 1000).toFixed(2);

            try {
              await message.reply({
                body: `✅ ${cleanedTitle}\n🕒 ${duration}s`,
                attachment: fs.createReadStream(filePath)
              });
            } catch (err) {
              console.error("❌ Reply error:", err);
            }

            fs.unlinkSync(filePath);
          });

          writer.on("error", (err) => {
            console.error("❌ Write error:", err);
            message.reply("❌ ভিডিও লেখার সময় সমস্যা হয়েছে।");
          });

        } catch (e) {
          console.error("❌ Error downloading:", e);
          message.reply("❌ ডাউনলোড করতে সমস্যা হয়েছে।");
        }

        break; // শুধুমাত্র প্রথম ভিডিও লিংকেই কাজ করবে
      }
    }
  }
};