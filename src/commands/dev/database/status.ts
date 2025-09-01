import { SubCommand, type CommandContext, Declare, Embed } from "seyfert";
import { SoundyOptions } from "#soundy/utils";

@Declare({
	name: "dbstatus",
	description: "Show Bun-first database status and connection information",
	defaultMemberPermissions: ["Administrator"],
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
})
@SoundyOptions({ onlyDeveloper: true })
export default class DbStatusCommand extends SubCommand {
	async run(ctx: CommandContext): Promise<void> {
		const { client } = ctx;
		const connections = await client.database.testConnections();
		const performance = await client.database.getPerformanceStats();
		const isReady = client.database.isReady();

		const embed = new Embed()
			.setTitle("⚙️ Bun-First Database Status")
			.setColor(
				isReady && connections.bun
					? ctx.client.config.color.yes
					: ctx.client.config.color.no,
			)
			.addFields([
				{
					name: "📊 System Status",
					value: `**Ready**: ${isReady ? "✅ Yes" : "❌ No"}`,
					inline: true,
				},
				{
					name: "💾 Bun SQLite",
					value: connections.bun ? "✅ Connected" : "❌ Disconnected",
					inline: true,
				},
				{
					name: "🌐 Turso (Fallback)",
					value: connections.turso ? "✅ Connected" : "❌ Disconnected",
					inline: true,
				},
				{
					name: "⚡ Bun Latency",
					value: `${performance.bunLatency}ms`,
					inline: true,
				},
				{
					name: "🔄 Turso Latency",
					value: `${performance.tursoLatency}ms`,
					inline: true,
				},
				{
					name: "🚀 Speed Improvement",
					value: `${performance.speedImprovement}x faster`,
					inline: true,
				},
				{
					name: "💾 Local Database",
					value: "`./data/soundy-bun.db`",
					inline: true,
				},
				{
					name: "💡 Strategy",
					value: "Bun-first with Turso fallback",
					inline: true,
				},
				{
					name: "⏱️ Uptime",
					value: `${Math.floor(process.uptime() / 60)}m`,
					inline: true,
				},
			])
			.setFooter({
				text: "Bun SQLite provides ultra-fast local operations with remote backup",
			})
			.setTimestamp();

		await ctx.editOrReply({
			embeds: [embed],
		});
	}
}
