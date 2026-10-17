import {
	type CommandContext,
	createBooleanOption,
	Declare,
	LocalesT,
	Options,
	SubCommand,
} from "seyfert";
import { SoundyCategory } from "#soundy/types";
import { clearNextTrack, SoundyOptions, syncNextTrack } from "#soundy/utils";

const option = {
	enabled: createBooleanOption({
		description: "Enable or disable gapless playback for this server",
		required: true,
		locales: {
			name: "cmd.toggle.sub.gapless.options.enabled.name",
			description: "cmd.toggle.sub.gapless.options.enabled.description",
		},
	}),
};

@Declare({
	name: "gapless",
	description: "Toggle gapless playback on this server",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
	defaultMemberPermissions: ["ManageGuild"],
})
@LocalesT("cmd.toggle.sub.gapless.name", "cmd.toggle.sub.gapless.description")
@SoundyOptions({ cooldown: 10, category: SoundyCategory.Configurations })
@Options(option)
export default class GaplessCommand extends SubCommand {
	async run(ctx: CommandContext<typeof option>) {
		const { client, options, guildId } = ctx;
		if (!guildId) return;

		const { cmd } = await ctx.getLocale();

		await client.database.setGapless(guildId, options.enabled);

		const player = client.manager.getPlayer(guildId);
		if (player) {
			if (options.enabled) {
				await syncNextTrack(client, player);
			} else {
				await clearNextTrack(client, player);
			}
		}

		const description = options.enabled
			? cmd.toggle.sub.gapless.run.enabled
			: cmd.toggle.sub.gapless.run.disabled;

		await ctx.editOrReply({
			embeds: [
				{
					description: `${client.config.emoji.yes} ${description}`,
					color: client.config.color.primary,
				},
			],
		});
	}
}
