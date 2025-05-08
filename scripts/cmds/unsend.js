module.exports = {
	config: {
		name: "unsend",
		version: "1.2",
		author: "NTKhang",
		countDown: 5,
		role: 0,
		aliases: ["u", "un", "unsent"],
		description: {
			en: "Unsend a message sent by the bot"
		},
		category: "box chat",
		guide: {
			en: "Reply to the bot's message you want to unsend and use the command {pn}"
		}
	},

	langs: {
		en: {
			syntaxError: "Please reply to the bot's message you want to unsend"
		}
	},

	onStart: async function ({ message, event, api, getLang }) {
		// Check if the message is a reply and if it's sent by the bot
		if (!event.messageReply || event.messageReply.senderID !== api.getCurrentUserID()) {
			return message.reply(getLang("syntaxError"));
		}

		// Unsend the replied message
		message.unsend(event.messageReply.messageID);
	}
};