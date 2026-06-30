import { type CommandContext, Declare, Embed, SubCommand } from "seyfert";
import { SoundyOptions } from "#soundy/utils";

@Declare({
	name: "performance",
	description: "Show database performance comparison between Bun and Turso",
	defaultMemberPermissions: ["Administrator"],
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
})
@SoundyOptions({ onlyDeveloper: true })
export default class DbPerfCommand extends SubCommand {
	async run(ctx: CommandContext): Promise<void> {
		const { client } = ctx;
		if (!ctx.guildId) {
			await ctx.editOrReply({
				content: "",
				embeds: [
					{
						description: `${ctx.client.config.emoji.no} This command can only be used in a guild.`,
						color: ctx.client.config.color.no,
					},
				],
			});
			return;
		}

		await ctx.editOrReply({
			content: "",
			embeds: [
				{
					description: "⏱️ Running Bun vs Turso performance test...",
					color: 0xffa500, // Orange color
				},
			],
		});

		try {
			// Get performance statistics from the database manager
			const performance = await client.database.getPerformanceStats();

			// Test Bun-first database methods
			const bunFirstStartTime = Date.now();
			await client.database.getLocale(ctx.guildId);
			const bunFirstDuration = Date.now() - bunFirstStartTime;

			// Calculate speed improvements
			const speedImprovement = performance.speedImprovement;
			const bunVsTurso =
				performance.tursoLatency > 0
					? (performance.tursoLatency / performance.bunLatency).toFixed(1)
					: "N/A";

			const embed = new Embed()
				.setTitle("⚡ Embedded Replica Performance Test")
				.setColor(client.config.color.yes)
				.addFields([
					{
						name: "💾 Local SQLite Replica",
						value: `${performance.bunLatency}ms`,
						inline: true,
					},
					{
						name: "🌐 Remote Turso Database",
						value: `${performance.tursoLatency}ms`,
						inline: true,
					},
					{
						name: "⚡ Direct Query Method",
						value: `${bunFirstDuration}ms`,
						inline: true,
					},
					{
						name: "📊 Speed Improvement",
						value: `**${speedImprovement}x faster** with Local Replica`,
						inline: false,
					},
					{
						name: "💡 Performance Analysis",
						value: [
							`🔥 Local vs Remote: **${bunVsTurso}x faster**`,
							`📈 Local replica advantage: **Ultra-fast reads**`,
							`🛡️ Synchronization: **Auto replication active**`,
						].join("\n"),
						inline: false,
					},
					{
						name: "🏆 Strategy",
						value:
							"Turso Embedded Replicas natively replicate data to a local SQLite database for fast access.",
						inline: false,
					},
				])
				.setFooter({
					text: "Embedded Replicas deliver local performance with global backup",
				})
				.setTimestamp();

			await ctx.editOrReply({
				embeds: [embed],
			});
		} catch (error) {
			console.error("Performance test failed:", error);
			await ctx.editOrReply({
				embeds: [
					new Embed()
						.setColor(client.config.color.no)
						.setDescription(
							`${client.config.emoji.no} Performance test failed: ${error}`,
						),
				],
			});
		}
	}
}
