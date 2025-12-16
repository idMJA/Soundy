import {
	type CommandContext,
	Declare,
	LocalesT,
	Middlewares,
	SubCommand,
} from "seyfert";
import { SoundyCategory } from "#soundy/types";
import { SoundyOptions } from "#soundy/utils";

@Declare({
	name: "247",
	description: "Toggle 24/7 mode on this servers",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
	defaultMemberPermissions: ["ManageGuild"],
})
@LocalesT("cmd.toggle.sub._247.name", "cmd.toggle.sub._247.description")
@SoundyOptions({ cooldown: 5, category: SoundyCategory.Configurations })
@Middlewares(["checkNodes", "checkVoiceChannel", "checkVoicePermissions"])
export default class Command247 extends SubCommand {
	async run(ctx: CommandContext) {
		const { client, guildId } = ctx;
		if (!guildId) return;

		const { cmd } = await ctx.getLocale();

		// Get or check current 24/7 mode status
		const mode247 = await client.database.get247Mode(guildId);
		const currentStatus = mode247?.enabled ?? false;

		// Get current player if exists
		let player = client.manager.getPlayer(guildId);

		if (currentStatus) {
			// Disable 24/7 mode
			await client.database.set247Mode(guildId, false);

			return ctx.editOrReply({
				embeds: [
					{
						description: `${client.config.emoji.yes} ${cmd.toggle.sub._247.run.disabled}`,
						color: client.config.color.primary,
					},
				],
			});
		}

		// Get voice channel
		const member = await ctx.member;
		if (!member) return;

		const voiceState = client.cache.voiceStates?.get(member.id, guildId);
		const voice = await voiceState?.channel();
		if (!voice?.is(["GuildVoice", "GuildStageVoice"])) return;

		// Get player settings
		const { defaultVolume } = await client.database.getPlayer(guildId);

		// If there's no player, create one
		if (!player) {
			player = client.manager.createPlayer({
				guildId: guildId,
				voiceChannelId: voice.id,
				textChannelId: ctx.channelId,
				volume: defaultVolume,
				selfDeaf: true,
			});

			// Set player metadata
			player.set("me", {
				...client.me,
				tag: client.me.username,
			});

			// Connect to voice channel
			await player.connect();

			// Handle stage channel
			if (voice.isStage()) {
				const bot = client.cache.voiceStates?.get(client.me.id, guildId);
				if (bot?.suppress) await bot.setSuppress(false);
			}
		}

		// Enable 24/7 mode with current channels
		await client.database.set247Mode(
			guildId,
			true,
			player.voiceChannelId ?? undefined,
			player.textChannelId ?? undefined,
		);

		return ctx.editOrReply({
			embeds: [
				{
					description: `${client.config.emoji.yes} ${cmd.toggle.sub._247.run.enabled}`,
					color: client.config.color.primary,
				},
			],
		});
	}
}
