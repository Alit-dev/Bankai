const axios = require("axios");
const baseApiUrl = async () => {
  const base = await axios.get(
    `https://raw.githubusercontent.com/Mostakim0978/D1PT0/refs/heads/main/baseApiUrl.json`,
  );
  return base.data.api;
};

module.exports = {
  config: {
    name: "spy",
    aliases: ["whoishe", "whoisshe", "who", "atake"],
    version: "1.0",
    role: 0,
    author: "Dipto",
    Description: "Get user information and profile photo",
    category: "information",
    countDown: 1,
  },

  onStart: async function ({ event, message, usersData, api, args }) {
    try {
      const uid1 = event.senderID;
      const uid2 = Object.keys(event.mentions)[0];
      let uid;

      if (args[0]) {
        if (/^\d+$/.test(args[0])) {
          uid = args[0];
        } else {
          const match = args[0].match(/profile\.php\?id=(\d+)/);
          if (match) {
            uid = match[1];
          }
        }
      }

      if (!uid) {
        uid = event.type === "message_reply" 
          ? event.messageReply.senderID 
          : uid2 || uid1;
      }

      const response = await axios.get(`${await baseApiUrl()}/baby?list=all`);
      const dataa = response.data || { teacher: { teacherList: [] } };
      let babyTeach = 0;

      if (dataa?.teacher?.teacherList?.length) {
        babyTeach = dataa.teacher.teacherList.find((t) => t[uid])?.[uid] || 0;
      }

      const userInfo = await api.getUserInfo(uid);
      const avatarUrl = await usersData.getAvatarUrl(uid);

      if (!userInfo[uid]) {
        return message.reply("User not found.");
      }

      let genderText;
      switch (userInfo[uid].gender) {
        case 1: genderText = "𝙶𝚒𝚛𝚕🙋🏻‍♀️"; break;
        case 2: genderText = "Boy🙋🏻‍♂️"; break;
        default: genderText = "𝙶𝚊𝚢🤷🏻‍♂️";
      }

      const money = (await usersData.get(uid)).money;
      const allUser = await usersData.getAll();
      const rank = allUser.slice().sort((a, b) => b.exp - a.exp).findIndex(user => user.userID === uid) + 1;
      const moneyRank = allUser.slice().sort((a, b) => b.money - a.money).findIndex(user => user.userID === uid) + 1;
      const position = userInfo[uid].type;

      const userInformation = `
👤 User Information:
──────────────
• Name: ${userInfo[uid].name}
• Nickname: ${userInfo[uid].alternateName || "None"}
• Birthday: ${userInfo[uid].isBirthday !== false ? userInfo[uid].isBirthday : "Private"}
• Gender: ${genderText}
• Class: ${position ? position.toUpperCase() : "Normal User"}
• UID: ${uid}
• Username: ${userInfo[uid].vanity || "None"}
• Profile URL: ${userInfo[uid].profileUrl}
──────────────`;

      // First send the information as a normal message (not a reply)
      await message.send(userInformation);

      // Then send the profile picture as a separate message
      await message.send({
        attachment: await global.utils.getStreamFromURL(avatarUrl)
      });

    } catch (error) {
      console.error("Error in spy command:", error);
      message.reply("An error occurred while fetching user information.");
    }
  },
};

function formatMoney(num) {
  const units = ["", "K", "M", "B", "T", "Q", "Qi", "Sx", "Sp", "Oc", "N", "D"];
  let unit = 0;
  while (num >= 1000 && ++unit < units.length) num /= 1000;
  return num.toFixed(1).replace(/\.0$/, "") + units[unit];
}