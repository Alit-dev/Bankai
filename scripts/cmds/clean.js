module.exports.config = {
    name: "clean",
    version: "0.0.2",
    author: "Marrcus",
    description: "Clean cache bot",
    category: "owner",
    usages: "Y/N",
    countdown: 5,
};

const fs = require('fs-extra');

// Set the onReply event
global.GoatBot = global.GoatBot || {};
global.GoatBot.onReply = global.GoatBot.onReply || new Map();

module.exports.onStart = async function({ api, event, args, utils, commandName }) {
    api.sendMessage('🗑️ Do you want to clean using AI or select Y/N', event.threadID, (e, info) => {
        global.GoatBot.onReply.set(info.messageID, {
            commandName,
            author: event.senderID,
            messageID: info.messageID
        });
    });
};

module.exports.onReply = async function({ api, event, args, Reply, commandName }) {
    const { type } = Reply;

    if (type === 'n') {
        const typesToDelete = event.body.split(' ');
        let success = [];

        for (const type of typesToDelete) {
            const files = fs.readdirSync(__dirname + `/cache`).filter(file => file.endsWith(`.` + type));

            for (const file of files) {
                try {
                    fs.unlinkSync(__dirname + `/cache/` + file);
                    success.push(file);
                } catch {
                    api.sendMessage(`⚠️ Error clearing storage: ${file}`, event.threadID);
                }
            }
        }

        if (success.length === 0) {
            return api.sendMessage('❎ You have already cleaned the cache', event.threadID);
        }
        
        return api.sendMessage('✅ Cache cleaned successfully', event.threadID);
    }

    switch (event.args[0].toLowerCase()) {
        case 'y': {
            const typesToDelete = ["png", "jpg", "mp4", "jpeg", "gif", "m4a", "txt", "mp3", "wav"];
            let success = [];

            for (const type of typesToDelete) {
                const files = fs.readdirSync(__dirname + `/cache`).filter(file => file.endsWith(`.` + type));

                for (const file of files) {
                    try {
                        fs.unlinkSync(__dirname + `/cache/` + file);
                        success.push(file);
                    } catch {
                        api.sendMessage(`⚠️ Error clearing storage: ${file}`, event.threadID);
                    }
                }
            }

            if (success.length === 0) {
                return api.sendMessage('❎ You have already cleaned the cache', event.threadID);
            }
            
            return api.sendMessage('✅ Cache cleaned successfully', event.threadID);
        }

        case 'n': {
            api.sendMessage('📌 Please reply with the types of files you want to delete\nExample: mp3 mp4', event.threadID, (e, info) => {
                global.GoatBot.onReply.set(info.messageID, {
                    type: 'n',
                    commandName,
                    author: event.senderID,
                    messageID: info.messageID
                });
            });
            break;
        }
    }
};