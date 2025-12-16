import { Command, type CommandContext, Declare, Middlewares } from "seyfert";
import { SoundyCategory } from "#soundy/types";
import { SoundyOptions } from "#soundy/utils";

@Declare({
	name: "rewind",
	description: "Rewind the current track by 10 seconds",
})
@SoundyOptions({
	category: SoundyCategory.Music,
	cooldown: 3,
})
@Middlewares(["checkVoiceChannel", "checkBotVoiceChannel", "checkPlayer"])
export default class RewindCommand extends Command {
	private formatDuration(duration: number): string {
		const hours = Math.floor(duration / 3600);
		const minutes = Math.floor((duration % 3600) / 60);
		const seconds = Math.floor(duration % 60);

		return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
	}

	override async run(ctx: CommandContext) {
		const { client, guildId } = ctx;
		if (!guildId) return;

		const { cmd } = await ctx.getLocale();

		const player = client.manager.getPlayer(guildId);
		if (!player?.queue.current) {
			return await ctx.editOrReply({
				embeds: [
					{
						description: `${client.config.emoji.warn} ${cmd.rewind.run.no_song}`,
						color: client.config.color.no,
					},
				],
			});
		}

		const currentTrack = player.queue.current;

		// If it's a stream, we can't rewind
		if (currentTrack.info.isStream) {
			return await ctx.editOrReply({
				embeds: [
					{
						description: `${client.config.emoji.warn} ${cmd.rewind.run.no_stream}`,
						color: client.config.color.no,
					},
				],
			});
		}

		// Current position in milliseconds
		const currentPosition = player.position;
		// Rewind by 10 seconds (10000 milliseconds)
		const rewindPosition = Math.max(currentPosition - 10000, 0);

		// Seek to the new position
		await player.seek(rewindPosition);

		await ctx.editOrReply({
			embeds: [
				{
					title: `${client.config.emoji.yes} ${cmd.rewind.run.title}`,
					description: cmd.rewind.run.description({
						rewindPosition: this.formatDuration(rewindPosition / 1000),
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
