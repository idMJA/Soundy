import type { Player, Track } from "lavalink-client";
import { ActionRow, Button, Embed, type User, type UsingClient } from "seyfert";
import { ButtonStyle, MessageFlags } from "seyfert/lib/types";
import { TimeFormat } from "#soundy/utils";
import { getSourceIcon } from "#soundy/utils";

/**
 * Creates the embed and components for the now playing display
 * @param client Discord client instance
 * @param player Lavalink player instance
 * @param track Currently playing track
 * @returns Object containing embed and components
 */
export async function createNowPlayingEmbed(
	client: UsingClient,
	player: Player,
	track: Track,
) {
	const duration = track.info.isStream
		? " LIVE"
		: (TimeFormat.toDotted(track.info.duration) ?? "Undetermined");

	const { event } = client.t(await client.database.getLocale(player.guildId));

	const embed = new Embed()
		.setAuthor({
			name: event.music.now_playing.get(),
			iconUrl: getSourceIcon(track.info.sourceName),
		})
		.setDescription(`## [${track.info.title}](${track.info.uri})`)
		.addFields([
			{
				name: `${client.config.emoji.music} ${event.music.artist.get()}`,
				value: `\` ${track.info.author} \``,
				inline: true,
			},
			{
				name: `${client.config.emoji.clock} ${event.music.duration.get()}`,
				value: `\` ${duration} \``,
				inline: true,
			},
			{
				name: `${client.config.emoji.user} ${event.music.requested_by.get()}`,
				value:
					track.requester && (track.requester as User).id
						? `<@${(track.requester as User).id}>`
						: "Unknown",
				inline: true,
			},
			{
				name: `${client.config.emoji.list} ${event.music.node.get()}`,
				value: `\` ${player.node.id} \``,
				inline: true,
			},
			{
				name: `${client.config.emoji.clock} ${event.music.finish_time.get()}`,
				value: `<t:${Math.floor((Date.now() + track.info.duration) / 1000)}:R>`,
				inline: true,
			},
		])
		.setImage(track.info.artworkUrl ?? "")
		.setColor(client.config.color.primary)
		.setTimestamp();

	const row1 = new ActionRow<Button>().addComponents(
		new Button()
			.setCustomId("player-shuffle")
			.setStyle(ButtonStyle.Secondary)
			.setEmoji(client.config.emoji.shuffle),
		new Button()
			.setCustomId("player-previous")
			.setStyle(ButtonStyle.Secondary)
			.setEmoji(client.config.emoji.previous),
		new Button()
			.setCustomId("player-pause")
			.setStyle(ButtonStyle.Secondary)
			.setEmoji(client.config.emoji.pause),
		new Button()
			.setCustomId("player-skip")
			.setStyle(ButtonStyle.Secondary)
			.setEmoji(client.config.emoji.skip),
		new Button()
			.setCustomId("player-loop")
			.setStyle(ButtonStyle.Secondary)
			.setEmoji(client.config.emoji.loop),
	);

	const row2 = new ActionRow<Button>().addComponents(
		new Button()
			.setCustomId("player-clear")
			.setStyle(ButtonStyle.Secondary)
			.setEmoji(client.config.emoji.trash),
		new Button()
			.setCustomId("player-voldown")
			.setStyle(ButtonStyle.Secondary)
			.setEmoji(client.config.emoji.volDown),
		new Button()
			.setCustomId("player-stop")
			.setStyle(ButtonStyle.Danger)
			.setEmoji(client.config.emoji.stop),
		new Button()
			.setCustomId("player-volup")
			.setStyle(ButtonStyle.Secondary)
			.setEmoji(client.config.emoji.volUp),
		new Button()
			.setCustomId("player-queue")
			.setStyle(ButtonStyle.Secondary)
			.setEmoji(client.config.emoji.list),
	);

	return {
		embeds: [embed],
		components: [row1, row2],
		flags: MessageFlags.SuppressNotifications,
	};
}

/**
 * Creates the embed for when no music is playing
 * @param client Discord client instance
 * @param guildId The guild ID for fetching localization
 * @returns Object containing embed and empty components
 */
export async function createNullEmbed(client: UsingClient, guildId: string) {
	const { event } = client.t(await client.database.getLocale(guildId));

	const embed = new Embed()
		.setTitle(`${client.config.emoji.music} ${event.setup.title.get()}`)
		.setDescription(event.setup.description.get())
		.setImage(client.config.info.banner)
		.setColor(client.config.color.primary)
		.setTimestamp();

	// Create disabled buttons to maintain layout
	const row1 = new ActionRow<Button>().addComponents(
		new Button()
			.setCustomId("player-shuffle")
			.setStyle(ButtonStyle.Secondary)
			.setEmoji(client.config.emoji.shuffle)
			.setDisabled(true),
		new Button()
			.setCustomId("player-previous")
			.setStyle(ButtonStyle.Secondary)
			.setEmoji(client.config.emoji.previous)
			.setDisabled(true),
		new Button()
			.setCustomId("player-pauseTrack")
			.setStyle(ButtonStyle.Secondary)
			.setEmoji(client.config.emoji.pause)
			.setDisabled(true),
		new Button()
			.setCustomId("player-skip")
			.setStyle(ButtonStyle.Secondary)
			.setEmoji(client.config.emoji.skip)
			.setDisabled(true),
		new Button()
			.setCustomId("player-loop")
			.setStyle(ButtonStyle.Secondary)
			.setEmoji(client.config.emoji.loop)
			.setDisabled(true),
	);

	const row2 = new ActionRow<Button>().addComponents(
		new Button()
			.setCustomId("player-clear")
			.setStyle(ButtonStyle.Secondary)
			.setEmoji(client.config.emoji.trash)
			.setDisabled(true),
		new Button()
			.setCustomId("player-voldown")
			.setStyle(ButtonStyle.Secondary)
			.setEmoji(client.config.emoji.volDown)
			.setDisabled(true),
		new Button()
			.setCustomId("player-stop")
			.setStyle(ButtonStyle.Danger)
			.setEmoji(client.config.emoji.stop)
			.setDisabled(true),
		new Button()
			.setCustomId("player-volup")
			.setStyle(ButtonStyle.Secondary)
			.setEmoji(client.config.emoji.volUp)
			.setDisabled(true),
		new Button()
			.setCustomId("player-queue")
			.setStyle(ButtonStyle.Secondary)
			.setEmoji(client.config.emoji.list)
			.setDisabled(true),
	);

	return {
		embeds: [embed],
		components: [row1, row2],
		flags: MessageFlags.SuppressNotifications,
	};
}
