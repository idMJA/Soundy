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
	name: "join",
	description: "Make the bot join your voice channel",
})
@SoundyOptions({
	category: SoundyCategory.Music,
	cooldown: 3,
})
@LocalesT("cmd.join.name", "cmd.join.description")
@Middlewares(["checkVoiceChannel"])
export default class JoinCommand extends Command {
	async run(ctx: CommandContext) {
		const { client } = ctx;

		const { cmd } = await ctx.getLocale();

		const guild = await ctx.guild();
		if (!guild) return;

		const member = await ctx.member;
		if (!member) return;

		const voiceChannel = (await member.voice()).channelId;
		if (!voiceChannel) return;

		// Check if a player already exists
		let player = client.manager.getPlayer(guild.id);

		// If no player exists, create one and connect to the voice channel
		if (!player) {
			player = await client.manager.createPlayer({
				guildId: guild.id,
				voiceChannelId: voiceChannel,
				textChannelId: ctx.channelId,
				selfDeaf: true,
			});
			await player.connect();
		}

		await ctx.editOrReply({
			embeds: [
				{
					title: `${client.config.emoji.yes} ${cmd.join.run.title}`,
					description: cmd.join.run.description({
						voiceChannel: `<#${voiceChannel}>`,
					}),
					color: client.config.color.primary,
				},
			],
		});
	}
}
