import {
	Command,
	type CommandContext,
	createStringOption,
	Declare,
	LocalesT,
	Options,
} from "seyfert";
import { SoundyCategory } from "#soundy/types";
import { SoundyOptions } from "#soundy/utils";

const option = {
	prefix: createStringOption({
		description:
			"Enter the new prefix (or ketik 'reset' untuk mengembalikan ke default)",
		required: true,
		locales: {
			name: "cmd.prefix.options.prefix.name",
			description: "cmd.prefix.options.prefix.description",
		},
	}),
};

@Declare({
	name: "prefix",
	description: "Set the prefix for this server",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
	defaultMemberPermissions: ["ManageGuild"],
})
@LocalesT("cmd.prefix.name", "cmd.prefix.description")
@SoundyOptions({ cooldown: 10, category: SoundyCategory.Configurations })
@Options(option)
export default class PrefixCommand extends Command {
	public override async run(ctx: CommandContext<typeof option>) {
		const { client, options, guildId } = ctx;
		if (!guildId) return;

		const { cmd } = await ctx.getLocale();

		if (!options.prefix) return;

		if (options.prefix.trim().toLowerCase() === "reset") {
			await client.database.deletePrefix(guildId);
			await ctx.editOrReply({
				embeds: [
					{
						description: `${client.config.emoji.yes} ${cmd.prefix.run.reset}`,
						color: client.config.color.primary,
					},
				],
			});
			return;
		}

		await client.database.setPrefix(guildId, options.prefix);
		await ctx.editOrReply({
			embeds: [
				{
					description: `${client.config.emoji.yes} ${cmd.prefix.run.success({ prefix: options.prefix })}`,
					color: client.config.color.primary,
				},
			],
		});
	}
}
