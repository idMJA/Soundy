import { Command, type CommandContext, Declare } from "seyfert";
import { SoundyOptions } from "#soundy/utils";

@Declare({
	name: "reload",
	description: "Reload Soundy",
	defaultMemberPermissions: ["ManageGuild", "Administrator"],
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
})
@SoundyOptions({ onlyDeveloper: true })
export default class ReloadCommand extends Command {
	async run(ctx: CommandContext): Promise<void> {
		await ctx.client
			.reload()
			.then(() =>
				ctx.editOrReply({
					content: "",
					embeds: [
						{
							description: `${ctx.client.config.emoji.yes} Soundy has been reloaded.`,
							color: ctx.client.config.color.yes,
						},
					],
				}),
			)
			.catch(() =>
				ctx.editOrReply({
					content: "",
					embeds: [
						{
							description: `${ctx.client.config.emoji.no} Something failed during the reload.`,
							color: ctx.client.config.color.no,
						},
					],
				}),
			);
	}
}
