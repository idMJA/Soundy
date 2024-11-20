const { Client, GatewayIntentBits, Events, EmbedBuilder, Colors, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const express = require("express");
const logs = require('../../utils/logs');

function initializeVoteTracker(client) {
    const app = express();
    const server = require("http").createServer(app);
    const { Webhook } = require("@top-gg/sdk");
    const dbl = new Webhook(client.config.topggAuth);

    client.on(Events.ClientReady, () => {
        logs.success(`Vote Tracker is Ready!`);
    });

    app.use(express.json());

    app.post(
        "/vote",
        dbl.listener(async ({ user: id }) => {
            const channel = client.channels.cache.get(client.config.topggVoteLog);
            const user = await client.users.fetch(id);

            try {
                const embed = new EmbedBuilder()
                    .setColor(client.config.embedColor)
                    .setAuthor({
                        name: `${user.username} just Voted!`,
                        iconURL: user.displayAvatarURL({ size: 4096 })
                    })
                    .setThumbnail(user.displayAvatarURL({ size: 4096 }))
                    .setDescription(
                        [
                            `${client.config.userEmoji} **${user.username}** \`(${user.id})\` just rocked the vote for [Soundy](https://soundy.mjba.live) on [Top.gg](https://top.gg/bot/${client.user.id}/vote)!\n\n${client.config.loveEmoji} You're awesome for choosing us! May your day be filled with fantastic tunes and good vibes. Let's keep the music playing!`,
                        ].join("\n")
                    )
                    .setFooter({ text: `Thanks for choosing Soundy!` })
                    .setTimestamp();

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setLabel('Vote')
                            .setStyle(ButtonStyle.Link)
                            .setURL(`https://top.gg/bot/${client.user.id}/vote`)
                            .setEmoji(client.config.partyEmoji),
                        new ButtonBuilder()
                            .setLabel('Invite')
                            .setStyle(ButtonStyle.Link)
                            .setURL(client.config.botInvite)
                            .setEmoji(client.config.linkEmoji)
                    );

                await channel.send({ embeds: [embed], components: [row] });
            } catch (e) {
                logs.error(e);
            }
        })
    );

    server.listen(client.config.topggPort, () => {
        logs.info(`Vote tracker listening on port ${client.config.topggPort}`);
    });
}

module.exports = { initializeVoteTracker };