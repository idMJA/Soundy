import {
	Command,
	type CommandContext,
	Declare,
	LocalesT,
	Middlewares,
} from "seyfert";
import { SoundyOptions } from "#soundy/utils";
import { SoundyCategory } from "#soundy/types";

@Declare({
	name: "grab",
	description: "Grab the currently playing song and send it to your DMs",
})
@SoundyOptions({
	category: SoundyCategory.Music,
	cooldown: 3,
})
@LocalesT("cmd.grab.name", "cmd.grab.description")
@Middlewares(["checkPlayer"])
export default class GrabCommand extends Command {
	private formatDuration(duration: number): string {
		const hours = Math.floor(duration / 3600);
		const minutes = Math.floor((duration % 3600) / 60);
		const seconds = Math.floor(duration % 60);

		return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
	}

	private getRequesterMention(requester: unknown): string {
		if (
			typeof requester === "object" &&
			requester !== null &&
			"id" in requester
		) {
			return `<@${requester.id}>`;
		}
		return "Unknown";
	}

	async run(ctx: CommandContext) {
		const { client, author } = ctx;

		const { cmd } = await ctx.getLocale();

		const guild = await ctx.guild();
		if (!guild) return;

		const player = client.manager.getPlayer(guild.id);
		if (!player?.queue.current) {
			return await ctx.editOrReply({
				embeds: [
					{
						description: cmd.grab.run.no_song,
						color: client.config.color.no,
					},
				],
			});
		}

		const song = player.queue.current;

		await client.users.write(author.id, {
			embeds: [
				{
					title: `${client.config.emoji.info} ${cmd.grab.run.title}`,
					url: song.info.uri,
					thumbnail: { url: song.info.artworkUrl || "" },
					description: `
                            ${client.config.emoji.music} **${cmd.grab.run.description[1]}:** [${song.info.title}](${song.info.uri})\n
                            ${client.config.emoji.clock} **${cmd.grab.run.description[2]}:** ${song.info.isStream ? "LIVE" : this.formatDuration(song.info.duration)}\n
                            ${client.config.emoji.user} **${cmd.grab.run.description[3]}:** ${this.getRequesterMention(song.requester)}`,
					color: client.config.color.primary,
				},
			],
		});

		return await ctx.editOrReply({
			embeds: [
				{
					description: cmd.grab.run.dm,
					color: client.config.color.primary,
				},
			],
		});
	}
}
