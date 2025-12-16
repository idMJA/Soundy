import { type CommandContext, Declare, Embed, SubCommand } from "seyfert";
import { SoundyOptions } from "#soundy/utils";

@Declare({
	name: "sync",
	description: "Sync data from Turso to Bun database",
	defaultMemberPermissions: ["Administrator"],
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
})
@SoundyOptions({ onlyDeveloper: true })
export default class DbSyncCommand extends SubCommand {
	async run(ctx: CommandContext): Promise<void> {
		const { client } = ctx;

		const embed = new Embed()
			.setColor(client.config.color.warn)
			.setDescription("🔄 Starting sync from Turso to Bun database...");

		await ctx.editOrReply({ embeds: [embed] });

		try {
			const startTime = Date.now();
			console.log("Starting database sync from Turso to Bun");

			const result = await client.database.sync();
			const duration = ((Date.now() - startTime) / 1000).toFixed(2);

			const embed = new Embed()
				.setColor(
					result.totalErrors > 0
						? client.config.color.no
						: client.config.color.yes,
				)
				.setTitle("🔄 Database Sync Complete")
				.setDescription(`Sync completed in ${duration}s`)
				.addFields([
					{
						name: "📊 Summary",
						value: `**Records Copied:** ${result.totalCopied}\n**Errors:** ${result.totalErrors}`,
						inline: true,
					},
				]);

			// Add table details
			const tableDetails: string[] = [];
			for (const [tableName, tableResult] of Object.entries(
				result.tablesSync,
			)) {
				if (tableResult && "copied" in tableResult && "errors" in tableResult) {
					if (tableResult.copied > 0 || tableResult.errors > 0) {
						const status = tableResult.errors > 0 ? "⚠️" : "✅";
						tableDetails.push(
							`${status} **${tableName}**: ${tableResult.copied} copied, ${tableResult.errors} errors`,
						);
					}
				}
			}

			if (tableDetails.length > 0) {
				embed.addFields([
					{
						name: "📋 Table Details",
						value: tableDetails.join("\n"),
						inline: false,
					},
				]);
			}

			await ctx.editOrReply({ embeds: [embed] });
			console.log(
				`Database sync completed: ${result.totalCopied} records copied, ${result.totalErrors} errors`,
			);
		} catch (error) {
			console.error("Database sync failed:", error);

			const embed = new Embed()
				.setColor(client.config.color.no)
				.setDescription(
					`${client.config.emoji.no} Failed to sync database: ${error instanceof Error ? error.message : "Unknown error"}`,
				);

			await ctx.editOrReply({ embeds: [embed] });
		}
	}
}
