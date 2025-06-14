import {
	ComponentCommand,
	type ComponentContext,
	Embed,
	Middlewares,
	type User,
} from "seyfert";
import { EmbedPaginator } from "#soundy/utils";
import { TimeFormat } from "#soundy/utils";

@Middlewares([
	"checkNodes",
	"checkVoiceChannel",
	"checkBotVoiceChannel",
	"checkPlayer",
	"checkQueue",
])
export default class QueueComponent extends ComponentCommand {
	componentType = "Button" as const;

	override filter(ctx: ComponentContext<typeof this.componentType>): boolean {
		return ctx.customId === "player-queue";
	}

	async run(ctx: ComponentContext<typeof this.componentType>): Promise<void> {
		const { client } = ctx;

		const guild = await ctx.guild();
		if (!guild) return;

		const player = client.manager.getPlayer(guild.id);
		if (!player) return;

		const { component } = await ctx.getLocale();

		const currentTrack = player.queue.current;
		const upcomingTracks = player.queue.tracks;
		const totalTracks = upcomingTracks.length + (currentTrack ? 1 : 0);

		const paginator = new EmbedPaginator(ctx);
		const tracksPerPage = 5;

		// Create first page with Now Playing
		const firstEmbed = new Embed()
			.setAuthor({ name: component.queue.name, iconUrl: guild.iconURL() })
			.setColor(client.config.color.primary)
			.setTimestamp()
			.setFooter({ text: component.queue.total({ total: totalTracks }) });

		if (currentTrack) {
			const author =
				currentTrack.info.author.length > 35
					? `${currentTrack.info.author.slice(0, 32)}...`
					: currentTrack.info.author;

			firstEmbed.addFields({
				name: `${client.config.emoji.play} ${component.queue.now_playing}:`,
				value:
					`${component.queue.track({ track: `**[${currentTrack.info.title}](${currentTrack.info.uri})**`, author: `\`${author}\`` })} - \`${TimeFormat.toDotted(currentTrack.info.duration)}\`\n` +
					`${component.queue.requested_by({ user: `<@${(currentTrack.requester as User).id}>` })}`,
			});
		}

		// Add upcoming tracks to first page
		if (upcomingTracks.length > 0) {
			const firstPageTracks = upcomingTracks.slice(0, tracksPerPage);
			const trackListStrings = firstPageTracks.map((track, i) => {
				const author = track.info.author || component.queue.unknown_artist;
				const trackAuthor =
					author.length > 35 ? `${author.slice(0, 32)}...` : author;
				const title =
					track.info.title.length > 45
						? `${track.info.title.slice(0, 42)}...`
						: track.info.title;
				return `${i + 1}. ${component.queue.track({ track: `**[${title}](${track.info.uri})**`, author: `\`${trackAuthor}\`` })}\n┗ \`${TimeFormat.toDotted(track.info.duration)}\` • <@${(track.requester as User).id}>`;
			});
			if (trackListStrings.length > 0) {
				firstEmbed.addFields({
					name: `${client.config.emoji.list} ${component.queue.up_next}:`,
					value: trackListStrings.join("\n\n"),
				});
			}
		}

		paginator.addEmbed(firstEmbed);

		// Create additional pages for remaining tracks
		for (let i = tracksPerPage; i < upcomingTracks.length; i += tracksPerPage) {
			const pageEmbed = new Embed()
				.setAuthor({ name: component.queue.name, iconUrl: guild.iconURL() })
				.setColor(client.config.color.primary)
				.setTimestamp()
				.setFooter({ text: component.queue.total({ total: totalTracks }) });

			if (currentTrack) {
				const author =
					currentTrack.info.author.length > 25
						? `${currentTrack.info.author.slice(0, 22)}...`
						: currentTrack.info.author;
				pageEmbed.addFields({
					name: `${client.config.emoji.play} ${component.queue.now_playing}:`,
					value:
						`${component.queue.track({ track: `**[${currentTrack.info.title}](${currentTrack.info.uri})**`, author: `\`${author}\`` })} - \`${TimeFormat.toDotted(currentTrack.info.duration)}\`\n` +
						`${component.queue.requested_by({ user: `<@${(currentTrack.requester as User).id}>` })}`,
				});
			}

			const pageTracks = upcomingTracks.slice(i, i + tracksPerPage);
			const trackListStrings = pageTracks.map((track, index) => {
				const author = track.info.author || component.queue.unknown_artist;
				const trackAuthor =
					author.length > 25 ? `${author.slice(0, 22)}...` : author;
				const title =
					track.info.title.length > 45
						? `${track.info.title.slice(0, 42)}...`
						: track.info.title;
				return `${i + index + 1}. ${component.queue.track({ track: `**[${title}](${track.info.uri})**`, author: `\`${trackAuthor}\`` })}\n┗ \`${TimeFormat.toDotted(track.info.duration)}\` • <@${(track.requester as User).id}>`;
			});
			if (trackListStrings.length > 0) {
				pageEmbed.addFields({
					name: `${client.config.emoji.list} ${component.queue.name}:`,
					value: trackListStrings.join("\n\n"),
				});
			}
			paginator.addEmbed(pageEmbed);
		}

		await paginator.reply(true);
	}
}
