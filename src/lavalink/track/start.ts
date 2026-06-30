// src/lavalink/events.ts

import type { User } from "seyfert";
import { LavalinkEventTypes } from "#soundy/types";
import {
	createLavalinkEvent,
	createNowPlayingEmbed,
	PlayerSaver,
} from "#soundy/utils";

export default createLavalinkEvent({
	name: "trackStart",
	type: LavalinkEventTypes.Manager,
	async run(client, player, track) {
		if (!(player.textChannelId && player.voiceChannelId)) return;
		if (!track) return;
		try {
			player.setData("me", {
				...client.me,
				tag: client.me.username,
			});

			const playerSaver = new PlayerSaver(client.logger);

			// Store locale string for lyrics
			const localeString = await client.database.getLocale(player.guildId);
			player.setData("localeString", localeString);

			const lyricsData = await playerSaver.getLyricsData(player.guildId);
			if (lyricsData) {
				if (lyricsData.lyricsEnabled) {
					player.setData("lyricsEnabled", lyricsData.lyricsEnabled);
				}
				if (lyricsData.lyricsId) {
					player.setData("lyricsId", lyricsData.lyricsId);
				}
				if (lyricsData.lyrics) {
					player.setData("lyrics", lyricsData.lyrics);
				}
			}

			// Clear disconnect timeout jika ada
			const disconnectTimeout = player.getData<NodeJS.Timeout | undefined>(
				"disconnectTimeout",
			);
			if (disconnectTimeout) {
				clearTimeout(disconnectTimeout);
				player.deleteData("disconnectTimeout");
			}

			// Clear lyrics interval jika ada
			const lyricsInterval = player.getData<NodeJS.Timeout | undefined>(
				"lyricsInterval",
			);
			if (lyricsInterval) {
				clearInterval(lyricsInterval);
				player.deleteData("lyricsInterval");
			}

			await client.database.updateTrackStats(
				track.info.uri,
				track.info.title,
				track.info.author,
				player.guildId,
				(track.requester as User).id,
				track.info.uri,
				track.info.artworkUrl ?? undefined,
				track.info.duration,
				track.info.isStream,
			);
			await client.database.updateUserStats(
				(track.requester as User).id,
				player.guildId,
			);

			const voice = await client.channels.fetch(player.voiceChannelId);
			if (!voice.is(["GuildStageVoice", "GuildVoice"])) return;

			// Update voice channel status if possible
			if (voice.is(["GuildVoice"])) {
				// Check if voice status is enabled for this guild
				const voiceStatusEnabled = await client.database.getVoiceStatus(
					player.guildId,
				);
				if (voiceStatusEnabled) {
					await voice
						.setVoiceStatus(
							`♪ **${track.info.title}** by **${track.info.author}**`,
						)
						.catch(() => null);
				}
			}

			// Buat embed now playing
			const nowPlaying = await createNowPlayingEmbed(client, player, track);
			// Check for setup message
			const setupData = await client.database.getSetup(player.guildId);
			if (setupData?.messageId) {
				try {
					const setupMessage = await client.messages.fetch(
						setupData.messageId,
						setupData.channelId,
					);
					if (setupMessage) {
						// Update existing setup message
						await client.messages.edit(
							setupMessage.id,
							setupData.channelId,
							nowPlaying,
						);
						// Simpan messageId dan channelId ke database
						const playerSaver = new PlayerSaver(client.logger);
						// Save player state using PlayerSaver
						const playerData = player.toJSON();
						const safeData = playerSaver.extractSafePlayerData(
							playerData as unknown as Record<string, unknown>,
						);
						safeData.messageId = setupData.messageId;
						await playerSaver.savePlayer(player.guildId, safeData);
						client.logger.info(
							`[Music] Saved player for guild ${player.guildId}`,
						);
						return;
					}
				} catch (error) {
					// If setup message not found or can't be edited, continue to regular message
					client.logger.debug(
						`[Music] Failed to update setup message: ${error}`,
					);
				}
			}
			const sentMessage = await client.messages.write(
				player.textChannelId,
				nowPlaying,
			);
			player.setData("messageId", sentMessage.id);

			// Simpan messageId dan channelId ke database
			await playerSaver.setLastNowPlayingMessage(
				player.guildId,
				sentMessage.id,
				player.textChannelId,
			);

			// Save player state using PlayerSaver
			const playerData = player.toJSON();
			const safeData = playerSaver.extractSafePlayerData(
				playerData as unknown as Record<string, unknown>,
			);
			safeData.messageId = sentMessage.id;
			await playerSaver.savePlayer(player.guildId, safeData);
			client.logger.info(`[Music] Saved player for guild ${player.guildId}`);
		} catch (err) {
			client.logger.error(
				"[Music] Failed to send trackStart message or save player state:",
				err,
			);
		}
	},
});
