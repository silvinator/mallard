const Discord = require("discord.js");
const yt = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const keys = require('./key');
const Speech = require('@google-cloud/speech');
const fs = require('fs');
const discordKey = keys.discord;
const projectId = keys.gcloud;
const bot = new Discord.Client();
const speechClient = Speech({
    projectId: projectId
});
const options = {
    config: {
        encoding: 'LINEAR16',
        sampleRate: 16000
    }
};

const randomElement = (arr) => {
    let rand = Math.floor(Math.random() * (arr.length));
    return arr[rand];
};


bot.on("presenceUpdate", (oldMember, newMember) => {
    if (oldMember.presence != newMember.presence) {
        const daveServer = newMember.guild;
        const daveChannel = daveServer.channels.get('130170121489481728');
        const inGame = daveServer.members.filter(m => m.presence.game !== null);

        let game;
        if (newMember.presence.game) {
            game = newMember.presence.game.name;
            const inOurGame = inGame.filter(g => g.presence.game.name === game).array();
            let count = inOurGame.length;
            let message = "";
            if (count >= gameAlerts[game]) {
                message += `It looks like there are ${count} people playing ${game}. Do you want to ping the other players? (yes/no) Please reply within 60 seconds or I will assume no.`;
            }
            if (message !== "") {
                bot.yesno = true;
                bot.userList = inOurGame;
                bot.channel = daveChannel;
                daveChannel.sendMessage(message).then(m => {
                    setTimeout(() => {
                        if (bot.yesno) {
                            m.delete();
                            bot.yesno = false;
                        }
                    }, 60000);
                });
            }
        }
    }


});


bot.on("guildMemberSpeaking", (member, speaking) => {
    if (bot.receiver && !member.user.bot && (member.voiceChannel === bot.currentChannel)) {

        const recognizeStream = speechClient.createRecognizeStream(options)
            .on('error', (err) => {
                console.log(err);
            })
            .on('data', (data) => {
                if (data.results !== "") console.log('Data received: %j', data.results);


                if (bot.yesno) {
                    if (data.results === "yes") {
                        let str = "";
                        bot.userList.forEach((user) => {
                            str += `${user.toString()} `;
                        });
                        bot.channel.sendMessage(`${str}hop in the voice channel!`);
                        bot.yesno = false;

                    } else if (data.results === "no") {
                        bot.yesno = false;

                    }
                }


                if (data.results.includes("kill")) {
                    let stream2 = yt("https://www.youtube.com/watch?v=tHAGig0Mq6o", {
                        audioonly: true
                    });
                    const dispatcher = bot.currentChannel.connection.playStream(stream2, {
                        volume: 0.16
                    });
                    bot.dispatcher = dispatcher;
                } else if (data.results.includes("very hard") || data.results.includes("difficult")) {
                    member.guild.defaultChannel.sendMessage("http://i3.kym-cdn.com/photos/images/original/000/966/173/ea6.jpg");
                }
            });


        if (speaking) {
            let stream = bot.receiver.createPCMStream(member.user);
            ffmpeg(stream)
                .inputFormat('s32le')
                .audioFrequency(16000)
                .audioChannels(1)
                .audioCodec('pcm_s16le')
                .format('s16le')
                .pipe(recognizeStream);

        }
    }
});

bot.on("message", msg => {
    if (bot.yesno) {
        if (msg.content === "yes") {
            let str = "";
            bot.userList.forEach((user) => {
                str += `${user.toString()} `;
            });
            bot.channel.sendMessage(`${str}hop in the voice channel!`);
            bot.yesno = false;
        } else if (msg.content === "no") {
            bot.yesno = false;
        }
    }
    if (!msg.author.bot) {

        if (msg.content === "!gtfo" || msg.content === "!leave") {
            if (bot.currentChannel) {
                bot.currentChannel.leave();
                bot.currentChannel = null;
                bot.dispatcher = null;
                bot.receiver = null;
            } else msg.channel.sendMessage("I'm not in a channel right now.");
        }
        if (msg.content === "!join") {
            if (msg.member.voiceChannel) {
                if (msg.member.voiceChannel.joinable) {
                    bot.currentChannel = msg.member.voiceChannel;
                    msg.member.voiceChannel.join()
                        .then(connection => {
                            const receiver = connection.createReceiver();
                            bot.receiver = receiver;
                        })
                        .catch(console.error);
                } else msg.channel.sendMessage("I can't join that channel.");
            } else msg.channel.sendMessage("You aren't in voice right now.");
        }
        if (msg.content === "!sing") {
            if (bot.currentChannel) {
                let stream = yt("https://www.youtube.com/watch?v=oItlCGLgbqQ", {
                    audioonly: true
                });
                const dispatcher = bot.currentChannel.connection.playStream(stream, {
                    volume: 0.36
                });
                bot.dispatcher = dispatcher;

            } else msg.channel.sendMessage("I'm not in voice.");
        }
        if (msg.content === "!stfu") {
            if (bot.dispatcher) {
                bot.dispatcher.end();
                bot.dispatcher = null;

            } else msg.channel.sendMessage("No dispatcher.");
        }
    }
});


bot.on('ready', () => {
    console.log('I am ready!');
    bot.yesno = false;
});
bot.on('error', () => {
    bot.currentChannel.leave();
});
bot.on('disconnect', () => {
    bot.currentChannel.leave();
});

bot.login(discordKey);
