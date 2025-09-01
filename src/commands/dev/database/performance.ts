import { SubCommand, type CommandContext, Declare, Embed } from "seyfert";
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
				.setTitle("⚡ Bun vs Turso Performance Test")
				.setColor(client.config.color.yes)
				.addFields([
					{
						name: "💾 Bun SQLite",
						value: `${performance.bunLatency}ms`,
						inline: true,
					},
					{
						name: "🌐 Turso Database",
						value: `${performance.tursoLatency}ms`,
						inline: true,
					},
					{
						name: "⚡ Bun-First Method",
						value: `${bunFirstDuration}ms`,
						inline: true,
					},
					{
						name: "📊 Speed Improvement",
						value: `**${speedImprovement}x faster** with Bun SQLite`,
						inline: false,
					},
					{
						name: "💡 Performance Analysis",
						value: [
							`🔥 Bun vs Turso: **${bunVsTurso}x faster**`,
							`📈 Local cache advantage: **Ultra-fast reads**`,
							`🛡️ Fallback protection: **Turso backup ready**`,
						].join("\n"),
						inline: false,
					},
					{
						name: "🏆 Strategy",
						value:
							"Bun-first with Turso fallback provides the best of both worlds",
						inline: false,
					},
				])
				.setFooter({ text: "Bun SQLite delivers ultra-fast local performance" })
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
