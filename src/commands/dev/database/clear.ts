import {
	type CommandContext,
	createBooleanOption,
	Declare,
	Embed,
	Options,
	SubCommand,
} from "seyfert";
import { SoundyOptions } from "#soundy/utils";

const options = {
	confirm: createBooleanOption({
		description: "Confirm that you want to clear the Bun database cache",
		required: true,
	}),
};

@Declare({
	name: "clear",
	description: "Clear Bun database cache (local data only)",
	defaultMemberPermissions: ["Administrator"],
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
})
@SoundyOptions({ onlyDeveloper: true })
@Options(options)
export default class DbClearCommand extends SubCommand {
	async run(ctx: CommandContext<typeof options>): Promise<void> {
		const { confirm } = ctx.options;
		const { client } = ctx;

		if (!confirm) {
			await ctx.editOrReply({
				embeds: [
					new Embed()
						.setColor(client.config.color.no)
						.setDescription(
							`${client.config.emoji.no} You must set \`confirm\` to \`true\` to clear the Bun database cache.`,
						),
				],
			});
			return;
		}

		const startTime = Date.now();

		await ctx.editOrReply({
			embeds: [
				new Embed()
					.setColor(client.config.color.warn)
					.setDescription(
						`${client.config.emoji.trash} Clearing Bun database cache...`,
					),
			],
		});

		try {
			// Clear Bun database by getting direct access
			const bunDb = client.database.getBunDb();

			// Clear all tables from Bun database
			await bunDb.exec("DELETE FROM guild");
			await bunDb.exec("DELETE FROM liked_songs");
			await bunDb.exec("DELETE FROM playlist");
			await bunDb.exec("DELETE FROM playlist_track");
			await bunDb.exec("DELETE FROM track_stats");
			await bunDb.exec("DELETE FROM user_stats");
			await bunDb.exec("DELETE FROM user_vote");

			const duration = Date.now() - startTime;

			await ctx.editOrReply({
				embeds: [
					new Embed()
						.setColor(client.config.color.yes)
						.setDescription(
							`${client.config.emoji.yes} Local replica database cleared successfully in ${duration}ms! Changes will replicate to remote Turso database.`,
						),
				],
			});
		} catch (error) {
			console.error("Database clear failed:", error);
			await ctx.editOrReply({
				embeds: [
					new Embed()
						.setColor(client.config.color.no)
						.setDescription(
							`${client.config.emoji.no} Failed to clear database cache: ${error}`,
						),
				],
			});
		}
	}
}
