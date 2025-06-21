import {
	Command,
	type CommandContext,
	Declare,
	type DefaultLocale,
	Options,
	createStringOption,
} from "seyfert";
import { SoundyOptions } from "#soundy/utils";
import { MessageFlags } from "seyfert/lib/types";
import { SoundyCategory } from "#soundy/types";

const option = {
	locale: createStringOption({
		description: "Enter the new languages",
		required: true,
		autocomplete: async (interaction) => {
			const { client } = interaction;

			await interaction.respond(
				Object.entries<DefaultLocale>(client.langs.values)
					.map(([value, l]) => ({
						name: `${l.metadata.name} [${l.metadata.code}] - ${l.metadata.translators.join(", ")}`,
						value,
					}))
					.slice(0, 25),
			);
		},
	}),
};

@Declare({
	name: "setlocale",
	description: "Change your server languages",
	aliases: ["locale", "lang", "language"],
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
	defaultMemberPermissions: ["ManageGuild"],
})
@SoundyOptions({ cooldown: 10, category: SoundyCategory.Configurations })
@Options(option)
export default class SetLocaleCommand extends Command {
	public override async run(ctx: CommandContext<typeof option>) {
		const { client, options, guildId } = ctx;
		const { locale } = options;

		if (!guildId) return;

		const locales = Object.keys(client.langs.values);
		if (!locales.includes(locale))
			return ctx.editOrReply({
				flags: MessageFlags.Ephemeral,
				embeds: [
					{
						description: `Invalid locale: ${locale}. Available locales: ${locales.join(", ")}`,
						color: client.config.color.yes,
					},
				],
			});

		await client.database.setLocale(guildId, locale);
		await ctx.editOrReply({
			flags: MessageFlags.Ephemeral,
			embeds: [
				{
					description: `Successfully set locale to: ${locale}`,
					color: client.config.color.primary,
				},
			],
		});
	}
}
