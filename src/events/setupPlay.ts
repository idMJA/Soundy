import { createEvent } from "seyfert";
import { TimeFormat } from "#soundy/utils";

export default createEvent({
	data: { name: "messageCreate" },
	async run(message, client) {
		if (message.author.bot) return;

		const guild = await message.guild();
		if (!guild) return;

		const locale = await client.database.getLocale(guild.id);
		const { cmd, event } = client.t(locale);

		// Check if message is in setup channel
		const setupData = await client.database.getSetup(guild.id);
		if (!setupData || setupData.channelId !== message.channelId) return;

		// Delete the user's message
		await message.delete().catch(() => {});

		// Check if user is in a voice channel
		const voiceState = await message.member?.voice();
		if (!voiceState?.channelId) {
			const reply = await client.messages.write(message.channelId, {
				embeds: [
					{
						color: client.config.color.no,
						description: `${client.config.emoji.no} ${event.setup.no_voice.get()}`,
					},
				],
			});
			setTimeout(
				() =>
					client.messages.delete(reply.id, message.channelId).catch(() => {}),
				5000,
			);
			return;
		}

		// Check bot permissions
		const voiceChannel = await client.channels.fetch(voiceState.channelId);
		if (!voiceChannel.is(["GuildVoice", "GuildStageVoice"])) return;

		if (!message.guildId) return; // Ensure we're in a guild
		const me = await client.members.fetch(message.guildId, client.me.id);
		const permissions = await client.channels.memberPermissions(
			voiceChannel.id,
			me,
		);
		if (!permissions.has(["Connect", "Speak"])) {
			const reply = await client.messages.write(message.channelId, {
				embeds: [
					{
						color: client.config.color.no,
						description: `${client.config.emoji.no} ${event.setup.no_connect.get()}`,
					},
				],
			});
			setTimeout(
				() =>
					client.messages.delete(reply.id, message.channelId).catch(() => {}),
				5000,
			);
			return;
		}

		// Get player settings from database
		const { defaultVolume } = await client.database.getPlayer(message.guildId);

		// Get or create player with proper settings
		let player = client.manager.getPlayer(guild.id);
		if (!player) {
			try {
				player = await client.manager.createPlayer({
					guildId: guild.id,
					voiceChannelId: voiceState.channelId,
					textChannelId: message.channelId,
					volume: defaultVolume,
					selfDeaf: true,
				});

				await player.connect();

				player.set("me", {
					...client.me,
					tag: client.me.username,
				});

				if (!player.get("localeString")) player.set("localeString", locale);

				// Handle stage channel
				const bot = client.cache.voiceStates?.get(
					client.me.id,
					message.guildId,
				);
				if (voiceChannel.isStage() && bot?.suppress)
					await bot.setSuppress(false);
			} catch (error) {
				console.error("Connection error:", error);
				const reply = await client.messages.write(message.channelId, {
					embeds: [
						{
							color: client.config.color.no,
							description: `${client.config.emoji.no} ${event.setup.failed.get()}`,
						},
					],
				});
				setTimeout(
					() =>
						client.messages.delete(reply.id, message.channelId).catch(() => {}),
					5000,
				);
				return;
			}
		}

		if (!player) return;

		// Search and play the track
		try {
			const result = await player.search(
				{ query: message.content },
				{
					...message.author,
					tag: message.author.tag,
				},
			);

			if (result.loadType === "empty" || result.loadType === "error") {
				const reply = await client.messages.write(message.channelId, {
					embeds: [
						{
							color: client.config.color.no,
							description: `${client.config.emoji.no} ${event.setup.no_results({ query: message.content }).get()}`,
						},
					],
				});
				setTimeout(
					() =>
						client.messages.delete(reply.id, message.channelId).catch(() => {}),
					5000,
				);
				return;
			}

			const embed = {
				color: client.config.color.primary,
				timestamp: new Date().toISOString(),
				footer: {
					text: cmd.requested_by({ user: message.author.username }).toString(),
					icon_url: message.author.avatarURL(),
				},
			};

			if (result.loadType === "playlist" && result.playlist) {
				if (player.get("enabledAutoplay"))
					await player.queue.add(result.tracks, 0);
				else await player.queue.add(result.tracks);

				Object.assign(embed, {
					title: `${client.config.emoji.play} ${event.music.added_playlist.get()}`,
					description: `**[${result.playlist.name}](${message.content})**`,
					fields: [
						{
							name: `${client.config.emoji.list} ${event.music.tracks.get()}`,
							value: event.music
								.added_songs({ songs: `\`${result.tracks.length}\`` })
								.get(),
							inline: true,
						},
						{
							name: `${client.config.emoji.user} ${event.music.requested_by.get()}`,
							value: `${message.author}`,
							inline: true,
						},
					],
				});
			} else if (result.tracks.length > 0) {
				const track = result.tracks[0];

				if (track) {
					if (player.get("enabledAutoplay")) await player.queue.add(track, 0);
					else await player.queue.add(track);
				}

				const status = track?.info.isStream
					? "LIVE"
					: TimeFormat.toDotted(track?.info.duration);

				Object.assign(embed, {
					title: `${client.config.emoji.play} ${event.music.added.get()}`,
					thumbnail: { url: track?.info.artworkUrl || null },
					description: `**[${track?.info.title}](${track?.info.uri})**`,
					fields: [
						{
							name: `${client.config.emoji.artist} ${event.music.artist.get()}`,
							value: `\`${track?.info.author}\``,
							inline: true,
						},
						{
							name: `${client.config.emoji.clock} ${event.music.duration.get()}`,
							value: `\`${status}\``,
							inline: true,
						},
						{
							name: `${client.config.emoji.user} ${event.music.requested_by.get()}`,
							value: `${message.author}`,
							inline: true,
						},
					],
				});
			}

			// Send the message to the channel
			const messageResponse = await client.messages.write(message.channelId, {
				embeds: [embed],
			});

			// Delete the message after 5 seconds
			setTimeout(() => {
				client.messages
					.delete(messageResponse.id, message.channelId)
					.catch(() => {});
			}, 5000);

			if (!player.playing) await player.play();
		} catch (error) {
			client.logger.error("Error in setup channel handler:", error);
			const reply = await client.messages.write(message.channelId, {
				embeds: [
					{
						color: client.config.color.no,
						description: `${client.config.emoji.no} ${event.setup.error.get()}`,
					},
				],
			});
			setTimeout(
				() =>
					client.messages.delete(reply.id, message.channelId).catch(() => {}),
				5000,
			);
		}
	},
});
