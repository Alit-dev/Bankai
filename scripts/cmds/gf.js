const axios = require("axios");

module.exports = {
  config: {
    name: "gf",
    version: "1.0",
    author: "Ove",
    countDown: 5,
    role: 0,
    shortDescription: "Find a random girl in the group",
    longDescription: "Finds and sends profile info of a random girl from group chat",
    category: "fun",
    guide: "{pn}"
  },

  onStart: async function ({ api, event, usersData, message }) {
    const threadInfo = await api.getThreadInfo(event.threadID);
    const senderID = event.senderID;

    if (!threadInfo.isGroup) {
      return message.reply("This command only works in group chats.");
    }

    const allIDs = threadInfo.participantIDs;
    const girlIDs = [];

    for (const id of allIDs) {
      try {
        const data = await usersData.get(id);
        if (data && data.gender === 1) { // Check for gender === 1 (female)
          girlIDs.push(id);
        }
      } catch (e) {
        continue;
      }
    }

    if (girlIDs.length === 0) {
      return message.reply("No girls found in this group.");
    }

    const randomGirlID = girlIDs[Math.floor(Math.random() * girlIDs.length)];
    const girlInfo = await api.getUserInfo(randomGirlID);
    const girl = girlInfo[randomGirlID];
    const avatarUrl = await usersData.getAvatarUrl(randomGirlID);
    const senderName = (await usersData.get(senderID)).name;

    const profileInfo = `
❤️ Found a GF for @${senderName}
• Name: ${girl.name}
• Nickname: ${girl.alternateName || "None"}
• Gender: ${girl.gender === 1 ? "Girl 🙋🏻‍♀️" : "Unknown"}
• Profile: ${girl.profileUrl}
• UID: ${randomGirlID}
`.trim();

    await message.send({
      body: profileInfo,
      attachment: await global.utils.getStreamFromURL(avatarUrl),
      mentions: [{ id: senderID, tag: senderName }]
    });
  }
};