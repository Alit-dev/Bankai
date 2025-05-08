const axios = require("axios");

// activeUsers অবজেক্ট দিয়ে ট্র্যাক করা হবে যেসব ইউজার বর্তমানে চ্যাট করছেন
const activeUsers = {};

module.exports = {
  config: {
    name: "gemini", // কমান্ডের নাম
    aliases: ["mini"],  // কোনো অতিরিক্ত আলিয়াস ব্যবহার না হলেও ফাঁকা রাখা
    version: "3.0",  // ভার্সন নম্বর
    author: "Alamin",  // আপনার নাম
    countDown: 2,  // কমান্ডের মধ্যে একটি কুলডাউন টাইম
    role: 0,  // ইউজারের রোল সেট করা
    shortDescription: {
      en: "Smart Gemini AI chat via reply only"  // সংক্ষিপ্ত বর্ণনা
    },
    longDescription: {
      en: "Start with .deep <question>, then only reply to that bot message to continue"  // বিস্তারিত বর্ণনা
    },
    category: "ai",  // ক্যাটেগরি (AI ক্যাটেগরি)
    guide: {
      en: ".deep <msg> → Start\nReply to bot's msg only to continue.\nOther replies/messages = No response"  // নির্দেশিকা
    }
  },

  // কমান্ড শুরু হওয়া
  onStart: async function ({ message, event, args }) {
    const { senderID } = event;  // ব্যবহারকারীর আইডি
    const text = args.join(" ");  // প্রশ্ন যা কমান্ডের মাধ্যমে পাঠানো হবে
    if (!text) return message.reply("Please provide a question for Gemini.");  // যদি প্রশ্ন না দেয়া হয়

    try {
      // Gemini API কল করে রেসপন্স পাওয়া
      const res = await axios.get(`https://api-new-dxgd.onrender.com/gemini?text=${encodeURIComponent(text)}`);
      const replyText = res.data.text || "No response.";  // রেসপন্সের টেক্সট
      const sent = await message.reply(replyText);  // বটের রেসপন্স

      // বর্তমান ইউজারের জন্য মেসেজ আইডি সংরক্ষণ
      activeUsers[senderID] = sent.messageID;
    } catch (err) {
      console.error(err);
      return message.reply("Error reaching Gemini.");  // API তে কোনো সমস্যা হলে
    }
  },

  // চ্যাটের জন্য ফাংশন
  onChat: async function ({ message, event }) {
    const { senderID, messageReply, body } = event;  // ইউজারের মেসেজ, রেপ্লাই মেসেজ

    // যদি ব্যবহারকারী এখনও সক্রিয় সেশন এ না থাকে
    if (!activeUsers[senderID]) return;

    // ব্যবহারকারী যদি বটের পূর্ববর্তী মেসেজে রিপ্লাই না দেয়
    if (!messageReply || messageReply.messageID !== activeUsers[senderID]) {
      delete activeUsers[senderID];  // সেশন বন্ধ করে দেওয়া
      return;
    }

    try {
      // Gemini API কল করে নতুন প্রশ্নের উত্তর পাওয়া
      const res = await axios.get(`https://api-new-dxgd.onrender.com/gemini?text=${encodeURIComponent(body)}`);
      const replyText = res.data.text || "No response.";  // রেসপন্সের টেক্সট
      const sent = await message.reply(replyText);  // নতুন রেসপন্স পাঠানো

      // ব্যবহারকারীর মেসেজ আইডি আপডেট করা যাতে শুধুমাত্র নতুন মেসেজে রিপ্লাই করা হয়
      activeUsers[senderID] = sent.messageID;
    } catch (err) {
      console.error(err);
      message.reply("Failed to get response.");  // API কলের সময় সমস্যা হলে
    }
  }
};