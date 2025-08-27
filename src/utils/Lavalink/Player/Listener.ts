import type { UsingClient, VoiceState } from "seyfert";

const timeouts: Map<string, NodeJS.Timeout> = new Map();

/**
 * The listener for the `voiceStateUpdate` event of the client.
 * This event is emitted when a voice state is updated.
 * @param {UsingClient} client The client instance.
 * @param {VoiceState} newState The new voice state.
 * @param {VoiceState} [oldState] The old voice state.
 * @returns {Promise<void>}
 */
export async function playerListener(
	client: UsingClient,
	newState: VoiceState,
	oldState?: VoiceState,
): Promise<void> {
	try {
		const { guildId } = newState;
		if (!guildId) return;

		const player = client.manager.getPlayer(guildId);
		if (!player) return;

		const botId = client.me.id;

		const locale = player.get<string>("localeString");
		const { event } = client.t(locale).get();

		if (
			oldState?.userId === botId &&
			oldState?.channelId &&
			!newState?.channelId
		) {
			if (player.textChannelId) {
				try {
					await client.messages.write(player.textChannelId, {
						embeds: [
							{
								description: `${client.config.emoji.warn} ${event.listeners.kicked}`,
								color: client.config.color.warn,
							},
						],
					});
				} catch (error) {
					client.logger.error(`Failed to send kick message: ${error}`);
				}
			}

			if (timeouts.has(guildId)) {
				clearTimeout(timeouts.get(guildId));
				timeouts.delete(guildId);
			}

			try {
				await player.destroy();
			} catch (error) {
				client.logger.error(`Failed to destroy player after kick: ${error}`);
			}
			return;
		}

		if (newState?.userId === botId || oldState?.userId === botId) return;

		if (oldState?.channelId === newState.channelId) return;

		if (!(player.textChannelId && player.voiceChannelId)) return;

		const channel = await client.channels.fetch(player.voiceChannelId);
		if (!channel?.is(["GuildVoice", "GuildStageVoice"])) return;

		const voiceStates = client.cache.voiceStates?.values(guildId) || [];

		const channelVoiceStates = voiceStates.filter(
			(state) => state.channelId === player.voiceChannelId,
		);

		let nonBotCount = 0;
		for (const state of channelVoiceStates) {
			try {
				const member = await state.member();
				if (!member.user.bot) {
					nonBotCount++;
				}
			} catch {}
		}

		const isEmpty = nonBotCount === 0;

		const mode247 = await client.database.get247Mode(guildId);
		const is247Enabled = mode247?.enabled ?? false;

		if (isEmpty) {
			if (!is247Enabled) {
				if (
					!player.playing &&
					!player.paused &&
					!(player.queue.tracks.length + Number(!!player.queue.current)) &&
					player.connected
				) {
					await player.destroy();
					await client.messages.write(player.textChannelId, {
						embeds: [
							{
								description: `${client.config.emoji.warn} ${event.listeners.no_members}`,
								color: client.config.color.warn,
							},
						],
					});
					return;
				}

				if (
					!player.playing &&
					player.paused &&
					player.queue.current &&
					!player.queue.tracks.length
				) {
					await player.destroy();
					await client.messages.write(player.textChannelId, {
						embeds: [
							{
								description: `${client.config.emoji.warn} ${event.listeners.no_members}`,
								color: client.config.color.warn,
							},
						],
					});
					return;
				}

				if (player.paused || player.playing) {
					if (player.playing) {
						await player.pause();
					}

					await client.messages.write(player.textChannelId, {
						embeds: [
							{
								description: `${client.config.emoji.warn} ${event.listeners.disconnect({ time: "30" })}`,
								color: client.config.color.warn,
							},
						],
					});

					if (timeouts.has(guildId)) {
						clearTimeout(timeouts.get(guildId));
					}

					const timeoutId = setTimeout(async () => {
						const currentPlayer = client.manager.getPlayer(guildId);
						if (currentPlayer) {
							try {
								const currentVoiceChannelId = currentPlayer.voiceChannelId;
								if (!currentVoiceChannelId) return;

								const currentChannel = await client.channels.fetch(
									currentVoiceChannelId,
								);
								if (currentChannel?.is(["GuildVoice", "GuildStageVoice"])) {
									const currentVoiceStates =
										client.cache.voiceStates?.values(guildId) || [];
									const currentChannelStates = currentVoiceStates.filter(
										(state) => state.channelId === currentVoiceChannelId,
									);

									let currentNonBotCount = 0;
									for (const state of currentChannelStates) {
										try {
											const member = await state.member();
											if (!member.user.bot) {
												currentNonBotCount++;
											}
										} catch {}
									}

									if (currentNonBotCount === 0) {
										await currentPlayer.destroy();
										const textChannelId = currentPlayer.textChannelId;
										if (textChannelId) {
											await client.messages.write(textChannelId, {
												embeds: [
													{
														description: `${client.config.emoji.warn} ${event.listeners.no_members}`,
														color: client.config.color.warn,
													},
												],
											});
										}
									}
								}
							} catch (error) {
								client.logger.error(`Error during auto disconnect: ${error}`);
							}
						}
						timeouts.delete(guildId);
					}, 30000);

					timeouts.set(guildId, timeoutId);
				}
			} else {
				if (player.playing) {
					await player.pause();
					await client.messages.write(player.textChannelId, {
						embeds: [
							{
								description: `${client.config.emoji.warn} ${event.listeners.paused_247}`,
								color: client.config.color.warn,
							},
						],
					});
				}

				if (timeouts.has(guildId)) {
					clearTimeout(timeouts.get(guildId));
					timeouts.delete(guildId);
				}
			}
		} else if (!isEmpty && player.paused) {
			await player.resume();
			await client.messages.write(player.textChannelId, {
				embeds: [
					{
						description: `${client.config.emoji.yes} ${event.listeners.resume}`,
						color: client.config.color.primary,
					},
				],
			});

			if (timeouts.has(guildId)) {
				clearTimeout(timeouts.get(guildId));
				timeouts.delete(guildId);
			}
		}
	} catch (error) {
		client.logger.error("Error in playerListener:", error);
	}
}
