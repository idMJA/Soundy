import {
	SubCommand,
	type CommandContext,
	Declare,
	Options,
	createBooleanOption,
	Embed,
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
			bunDb.run("DELETE FROM guild");
			bunDb.run("DELETE FROM liked_songs");
			bunDb.run("DELETE FROM playlist");
			bunDb.run("DELETE FROM playlist_track");
			bunDb.run("DELETE FROM track_stats");
			bunDb.run("DELETE FROM user_stats");
			bunDb.run("DELETE FROM user_vote");

			const duration = Date.now() - startTime;

			await ctx.editOrReply({
				embeds: [
					new Embed()
						.setColor(client.config.color.yes)
						.setDescription(
							`${client.config.emoji.yes} Bun database cleared successfully in ${duration}ms! Turso database remains intact for backup.`,
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
