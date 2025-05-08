const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "delate",
    aliases: ["dl", "del"],
    author: "Alamin",
    version: "1.0",
    role: 2,
    description: "Delete command file (admin only)",
    usage: "delate <fileName>.js",
    category: "owner"
  },

  onStart: async function ({ args, message, event }) {
    const commandName = args[0];
    const senderID = event.senderID;

    // Only allow the specific admin UID
    if (senderID !== "100077745636690") {
      return message.reply("⛔ Only bot admins can delete command files.");
    }

    if (!commandName || !commandName.endsWith(".js")) {
      return message.reply("⚠️ Use: delate <fileName>.js");
    }

    // Prevent directory traversal
    if (commandName.includes("..") || commandName.includes("/")) {
      return message.reply("❌ Invalid file name.");
    }

    const filePath = path.join(__dirname, commandName);

    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        message.reply(`✅ ${commandName} command file has been deleted.`);
      } else {
        message.reply(`❌ Cannot find the file: ${commandName}`);
      }
    } catch (err) {
      console.error(err);
      message.reply(`❌ Error deleting ${commandName}: ${err.message}`);
    }
  }
};
