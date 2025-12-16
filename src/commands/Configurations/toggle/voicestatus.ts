import {
	type CommandContext,
	createBooleanOption,
	Declare,
	LocalesT,
	Options,
	SubCommand,
} from "seyfert";
import { SoundyCategory } from "#soundy/types";
import { SoundyOptions } from "#soundy/utils";

const option = {
	enabled: createBooleanOption({
		description: "Enable or disable voice status for this server",
		required: true,
		locales: {
			name: "cmd.toggle.sub.voicestatus.options.enabled.name",
			description: "cmd.toggle.sub.voicestatus.options.enabled.description",
		},
	}),
};

@Declare({
	name: "voicestatus",
	description: "Toggle voice status on this servers",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
	defaultMemberPermissions: ["ManageGuild"],
})
@LocalesT(
	"cmd.toggle.sub.voicestatus.name",
	"cmd.toggle.sub.voicestatus.description",
)
@SoundyOptions({ cooldown: 10, category: SoundyCategory.Configurations })
@Options(option)
export default class VoiceStatusCommand extends SubCommand {
	async run(ctx: CommandContext<typeof option>) {
		const { client, options, guildId } = ctx;
		if (!guildId) return;

		const { cmd } = await ctx.getLocale();

		await client.database.setVoiceStatus(guildId, options.enabled);

		const description = options.enabled
			? cmd.toggle.sub.voicestatus.run.enabled
			: cmd.toggle.sub.voicestatus.run.disabled;

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
