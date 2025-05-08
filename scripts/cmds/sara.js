const axios = require("axios");

module.exports = {
  config: {
    name: "sara",
    version: "1.0",
    author: "Custom by You",
    countDown: 0,
    role: 0,
    description: {
      en: "Auto chat & learning bot without prefix using sara-api"
    },
    category: "ai"
  },

  onStart: async function () {},

  onChat: async function({ api, event }) {
    const message = event.body && event.body.toLowerCase().trim();
    if (!message) return;

    const triggerWords = ["hi", "hello", "bby", "bot", "assalamualaikum", "kemon acho"];
    if (!triggerWords.includes(message)) return;

    try {
      const res = await axios.get(`https://sara-api-hjfe.onrender.com/text=${encodeURIComponent(message)}`);
      const data = res.data;

      if (data?.answer && !data?.error) {
        return api.sendMessage(data.answer, event.threadID, (err, info) => {
          if (!err && info) {
            global.GoatBot.onReply.set(info.messageID, {
              commandName: "sara",
              messageID: info.messageID,
              question: message,
              fromApi: true,
              canLearn: true,
              senderName: event.senderID
            });
          }
        }, event.messageID);
      } else {
        return api.sendMessage("Eita ami jani nah. Eitar uttor amake reply diye shikhai din!", event.threadID, (err, info) => {
          if (!err && info) {
            global.GoatBot.onReply.set(info.messageID, {
              commandName: "sara",
              messageID: info.messageID,
              question: message,
              fromApi: false,
              canLearn: true,
              senderName: event.senderID
            });
          }
        }, event.messageID);
      }
    } catch (e) {
      return api.sendMessage("Server e somossa. Poroborti te chesta korun.", event.threadID, event.messageID);
    }
  },

  onReply: async function({ api, event, Reply }) {
    const userReply = event.body?.trim();
    if (!userReply) return;

    try {
      const senderInfo = await api.getUserInfo(event.senderID);
      const teacherName = senderInfo?.[event.senderID]?.name || "Unknown";

      // Shikhano part
      if (!Reply.fromApi && Reply.canLearn) {
        const learnURL = `https://sara-api-hjfe.onrender.com/sikho?data=${encodeURIComponent(Reply.question + ":" + userReply)}&teacher=${encodeURIComponent(teacherName)}`;
        await axios.get(learnURL);

        // ❤️‍🩹 react
        api.setMessageReaction("❤️‍🩹", event.messageID, () => {}, true);

        // Random ekta question ask
        const allDataRes = await axios.get("https://sara-api-hjfe.onrender.com/show=all");
        const questions = allDataRes.data?.data;

        if (Array.isArray(questions) && questions.length > 0) {
          const random = questions[Math.floor(Math.random() * questions.length)];
          return api.sendMessage(` ${random.question}`, event.threadID, event.messageID);
        } else {
          return;
        }
      }

      // Jodi API answer ektu age fail korechilo, abar check kore dekhi
      if (Reply.fromApi && Reply.canLearn) {
        const res = await axios.get(`https://sara-api-hjfe.onrender.com/text=${encodeURIComponent(userReply)}`);
        const data = res.data;

        if (data?.answer && !data?.error) {
          return api.sendMessage(data.answer, event.threadID, (err, info) => {
            if (!err && info) {
              global.GoatBot.onReply.set(info.messageID, {
                commandName: "sara",
                messageID: info.messageID,
                question: userReply,
                fromApi: true,
                canLearn: true,
                senderName: event.senderID
              });
            }
          }, event.messageID);
        } else {
          return api.sendMessage("Eita ami jani nah. Eitar uttor amake reply diye shikhai din!", event.threadID, (err, info) => {
            if (!err && info) {
              global.GoatBot.onReply.set(info.messageID, {
                commandName: "sara",
                messageID: info.messageID,
                question: userReply,
                fromApi: false,
                canLearn: true,
                senderName: event.senderID
              });
            }
          }, event.messageID);q
        }
      }

    } catch (e) {
      return api.sendMessage("Sikhate giye somossa hoyeche. Poroborti te chesta korun.", event.threadID, event.messageID);
    }
  }
};