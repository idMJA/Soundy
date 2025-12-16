import {
	Command,
	type CommandContext,
	Declare,
	LocalesT,
	Middlewares,
} from "seyfert";
import { SoundyCategory } from "#soundy/types";
import { SoundyOptions } from "#soundy/utils";

@Declare({
	name: "forward",
	description: "Forward the current track by 10 seconds",
})
@SoundyOptions({
	category: SoundyCategory.Music,
	cooldown: 3,
})
@LocalesT("cmd.forward.name", "cmd.forward.description")
@Middlewares(["checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer"])
export default class ForwardCommand extends Command {
	private formatDuration(duration: number): string {
		const hours = Math.floor(duration / 3600);
		const minutes = Math.floor((duration % 3600) / 60);
		const seconds = Math.floor(duration % 60);

		return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
	}

	async run(ctx: CommandContext) {
		const { client } = ctx;

		const { cmd } = await ctx.getLocale();

		const guild = await ctx.guild();
		if (!guild) return;

		const player = client.manager.getPlayer(guild.id);
		if (!player?.queue.current) {
			return await ctx.editOrReply({
				embeds: [
					{
						description: cmd.forward.run.no_song,
						color: client.config.color.no,
					},
				],
			});
		}

		const currentTrack = player.queue.current;

		// If it's a stream, we can't forward
		if (currentTrack.info.isStream) {
			return await ctx.editOrReply({
				embeds: [
					{
						description: cmd.forward.run.stream,
						color: client.config.color.no,
					},
				],
			});
		}

		// Current position in milliseconds
		const currentPosition = player.position;
		// Forward by 10 seconds (10000 milliseconds)
		const forwardPosition = Math.min(
			currentPosition + 10000,
			currentTrack.info.duration,
		);

		// Seek to the new position
		await player.seek(forwardPosition);

		await ctx.editOrReply({
			embeds: [
				{
					title: `${client.config.emoji.forward} ${cmd.forward.run.title}`,
					description: cmd.forward.run.description({
						forwardPosition: forwardPosition / 1000,
						currentTrack: this.formatDuration(
							currentTrack.info.duration / 1000,
						),
					}),
					color: client.config.color.primary,
				},
			],
		});
	}
}
