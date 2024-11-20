const { Events, EmbedBuilder, ButtonStyle, ButtonBuilder, ActionRowBuilder } = require("discord.js");

module.exports = {
    name: Events.MessageCreate,

    async execute(message, client) {
        if (message.author.bot) return;
        
        // Check if the message content is exactly the bot mention and nothing else
        if (message.content.trim() === `<@${client.user.id}>`) {
            let totalSeconds = (client.uptime / 1000);
            let days = Math.floor(totalSeconds / 86400);
            totalSeconds %= 86400;
            let hours = Math.floor(totalSeconds / 3600);
            totalSeconds %= 3600;
            let minutes = Math.floor(totalSeconds / 60);
            let seconds = Math.floor(totalSeconds % 60);

            let uptime = `${days}d ${hours}h ${minutes}m ${seconds}s`;

            const pingEmbed = new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setTitle(`${client.config.pingEmoji} • Who just mentioned me??`)
            .setDescription(`Hey there **${message.author.displayName}**!, here is some useful information about me.\n ${client.config.questionEmoji} • **How to view all commands?**\nYou can use **/help** to view a list of all the commands!`)
            .addFields({ name: `${client.config.globeEmoji} **• Website:**`, value: 'https://soundy.mjba.live/'})
            .addFields({ name: `${client.config.homeEmoji} **• Servers:**`, value: `\`\`\`${client.guilds.cache.size}\`\`\``, inline: true })
            .addFields({ name: `${client.config.userEmoji} **• Users:**`, value: `\`\`\`${client.guilds.cache.reduce((a,b) => a+b.memberCount, 0)}\`\`\``, inline: true})
            .addFields({ name: `${client.config.slashEmoji} **• Commands:**`, value: `\`\`\`${client.commands.size}\`\`\``, inline: true})
            .addFields({ name: `${client.config.pingEmoji} **• Latency:**`, value: `\`\`\`${Math.round(client.ws.ping)}ms\`\`\``, inline: true})
            .addFields({ name: `${client.config.clockEmoji} **• Uptime:**`, value: `\`\`\`${uptime}\`\`\``, inline: true})
            .setTimestamp()
            .setThumbnail(client.user.avatarURL())
            .setFooter({text: `Requested by ${message.author.username}`})
            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setEmoji(client.config.linkEmoji)
                    .setLabel("Invite")
                    .setURL(client.config.botInvite)
                    .setStyle(ButtonStyle.Link),
                new ButtonBuilder()
                    .setEmoji(client.config.homeEmoji)
                    .setLabel("Support Server") 
                    .setURL(client.config.botServerInvite)
                    .setStyle(ButtonStyle.Link)
            );

            return message.reply({ embeds: [pingEmbed], components: [buttons] });
        }
    },
};