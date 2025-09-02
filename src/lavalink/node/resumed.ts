import { PlayerSaver } from "#soundy/utils";
import { LavalinkEventTypes } from "#soundy/types";
import { createLavalinkEvent } from "#soundy/utils";
import type {
	LavalinkNode,
	InvalidLavalinkRestRequest,
	LavalinkPlayer,
	Track,
} from "lavalink-client";

const resumingPlayers = new Set<string>();

export default createLavalinkEvent({
	name: "resumed",
	type: LavalinkEventTypes.Node,
	async run(
		client,
		node: LavalinkNode,
		payload: { resumed: true; sessionId: string; op: "ready" },
		players: InvalidLavalinkRestRequest | LavalinkPlayer[],
	) {
		if (!Array.isArray(players)) {
			client.logger.error("[Music] Players is not an array", players);
			return;
		}
		client.logger.info(
			`[Music] Node ${node.id} resumed session with ${players.length} players`,
		);

		if (payload.sessionId) {
			try {
				const playerSaver = new PlayerSaver(client.logger);
				client.logger.info(`[Music] Updating Session ID for node ${node.id}`);
				await playerSaver.saveNodeSession(node.options.host, payload.sessionId);
			} catch (err) {
				client.logger.error("[Music] Failed to save node session ID:", err);
			}
		}

		const playerSaver = new PlayerSaver(client.logger);
		for (const data of players) {
			try {
				const dataOfSaving = await playerSaver.getPlayer(data.guildId);
				if (!dataOfSaving) {
					client.logger.error(
						`[Music] Player data not found for guild ${data.guildId}`,
					);
					continue;
				}

				try {
					const currentLocale = await client.database.getLocale(data.guildId);
					await playerSaver.saveLyricsData(data.guildId, {
						localeString: currentLocale,
					});
				} catch (error) {
					client.logger.error(
						`[Music] Failed to save locale for guild ${data.guildId}:`,
						error,
					);
				}

				if (!data.state.connected) {
					client.logger.info(
						`[Music] Skipping resuming player ${data.guildId}, because it already disconnected`,
					);
					await playerSaver.delPlayer(data.guildId);
					continue;
				}

				resumingPlayers.add(data.guildId);

				const player = client.manager.createPlayer({
					guildId: data.guildId,
					voiceChannelId: dataOfSaving.voiceChannelId || "",
					textChannelId: dataOfSaving.textChannelId || "",
					selfDeaf: dataOfSaving.options?.selfDeaf || true,
					selfMute: dataOfSaving.options?.selfMute || false,
					volume: client.manager.options.playerOptions?.volumeDecrementer
						? Math.round(
								data.volume /
									client.manager.options.playerOptions.volumeDecrementer,
							)
						: data.volume,
					node: node.options.host,
					applyVolumeAsFilter:
						dataOfSaving.options?.applyVolumeAsFilter || false,
					instaUpdateFiltersFix:
						dataOfSaving.options?.instaUpdateFiltersFix || false,
					vcRegion: dataOfSaving.options?.vcRegion || undefined,
				});

				player.set("me", {
					...client.me,
					tag: client.me.username,
				});

				if (dataOfSaving.localeString) {
					player.set("localeString", dataOfSaving.localeString);
				}

				if (dataOfSaving.repeatMode) {
					try {
						await player.setRepeatMode(dataOfSaving.repeatMode);
					} catch (e) {
						client.logger?.error?.(
							`Failed to restore repeatMode for guild ${data.guildId}:`,
							e,
						);
					}
				}

				if (typeof dataOfSaving.enabledAutoplay === "boolean") {
					player.set("enabledAutoplay", dataOfSaving.enabledAutoplay);
				}

				await player.connect();
				player.filterManager.data = data.filters;
				await player.queue.utils.sync(true, false).catch(() => {});

				const wasPlaying = !data.paused && !!data.track;
				const trackPosition = data.state.position;
				player.lastPosition = trackPosition;
				player.lastPositionChange = Date.now();
				player.ping.lavalink = data.state.ping;
				player.paused = data.paused;
				player.playing = wasPlaying;

				if (data.track) {
					client.logger.info(
						`[Music] Restoring track for guild ${data.guildId}`,
					);
					player.queue.current = client.manager.utils.buildTrack(
						data.track,
						player.queue.current?.requester || null,
					);
					if (wasPlaying) {
						try {
							await player.play({ noReplace: true });
							if (trackPosition > 0) {
								await player.seek(trackPosition);
								client.logger.info(
									`[Music] Resumed at ${trackPosition}ms for guild ${data.guildId}`,
								);
							}
						} catch (error) {
							client.logger.error(
								"[Music] Error resuming track playback:",
								error,
							);
						}
					}
				}

				if (
					dataOfSaving.queue &&
					Array.isArray(dataOfSaving.queue) &&
					dataOfSaving.queue.length > 0
				) {
					try {
						let restoredCount = 0;
						for (const trackData of dataOfSaving.queue) {
							try {
								if (trackData.encoded) {
									let safeRequester = null;
									if (trackData.requester) {
										if (
											typeof trackData.requester === "object" &&
											trackData.requester !== null &&
											"id" in trackData.requester
										) {
											safeRequester = { id: trackData.requester.id };
										} else if (typeof trackData.requester === "string") {
											safeRequester = trackData.requester;
										}
									}
									const trackToAdd = {
										encoded: trackData.encoded,
										info: trackData.info || {},
										userData: {},
										requester: safeRequester,
									};
									player.queue.tracks.push(trackToAdd as unknown as Track);
									restoredCount++;
								}
							} catch (error) {
								client.logger.error(
									"[Music] Error adding track to queue:",
									error,
								);
							}
						}
						client.logger.info(
							`[Music] Restored ${restoredCount} tracks for guild ${data.guildId}`,
						);
					} catch (error) {
						client.logger.error(
							`[Music] Error during queue restoration for guild ${data.guildId}:`,
							error,
						);
					}
				}

				setTimeout(() => {
					resumingPlayers.delete(data.guildId);
				}, 1000);

				try {
					const savedLyricsData = await playerSaver.getLyricsData(data.guildId);
					if (savedLyricsData?.lyricsEnabled && player.queue.current) {
						await player.subscribeLyrics();
						player.set("lyricsEnabled", true);
						if (savedLyricsData.lyricsId) {
							player.set("lyricsId", savedLyricsData.lyricsId);
						}
						if (savedLyricsData.lyricsRequester) {
							player.set("lyricsRequester", savedLyricsData.lyricsRequester);
						}
						if (savedLyricsData.lyrics) {
							player.set("lyrics", savedLyricsData.lyrics);
						}
						client.logger.info(
							`[Music] Re-subscribed lyrics for guild ${data.guildId}`,
						);
					}
				} catch (error) {
					client.logger.error(
						`[Music] Failed to re-subscribe lyrics for guild ${data.guildId}:`,
						error,
					);
				}

				if (player.textChannelId) {
					try {
						client.logger.info(
							`[Music] Player ${player.guildId} resumed in channel ${player.textChannelId}`,
						);
					} catch (error) {
						client.logger.error("[Music] Error with resuming message:", error);
					}
				}
			} catch (error) {
				client.logger.error(
					`[Music] Error resuming player for guild ${data.guildId}:`,
					error,
				);
				resumingPlayers.delete(data.guildId);
			}
		}
	},
});
