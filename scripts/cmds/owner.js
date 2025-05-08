module.exports = {
  config: {
    name: "owner",
    aliases: ["owner", "creator"],
    version: "1.0",
    author: "Alamin",
    countDown: 5,
    role: 0,
    longDescription: "Provides information about Alamin and shares contact",
    category: "info",
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ api, event, message, args }) {
    const { threadID, messageReply, senderID, mentions, type } = event;

    // First, send an intro message
    const infoMessage = `
Levi Ackerman
`.trim();

    await message.reply(infoMessage);

    // Then send contact (after a short delay to look natural)
    setTimeout(async () => {
      let id;

      if (type === "message_reply" && messageReply?.senderID) {
        id = messageReply.senderID;
      } else if (Object.keys(mentions || {}).length > 0) {
        id = Object.keys(mentions)[0].replace(/\&mibextid=ZbWKwL/g, '');
      } else if (args[0]) {
        id = isNaN(args[0]) ? await global.utils.getUID(args[0]) : args[0];
      } else {
        id = senderID;
      }

      api.shareContact("", id, threadID);
    }, 1000); // Wait 1 second before sending contact
  }
};
