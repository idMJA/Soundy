import { type CommandContext, Declare, Embed, SubCommand } from "seyfert";
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
			.setTitle("⚙️ Turso Embedded Replica Status")
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
					name: "💾 Local SQLite Replica",
					value: connections.bun ? "✅ Connected" : "❌ Disconnected",
					inline: true,
				},
				{
					name: "🌐 Remote Turso Database",
					value: connections.turso ? "✅ Connected" : "❌ Disconnected",
					inline: true,
				},
				{
					name: "⚡ Local Latency",
					value: `${performance.bunLatency}ms`,
					inline: true,
				},
				{
					name: "🔄 Remote Latency",
					value: `${performance.tursoLatency}ms`,
					inline: true,
				},
				{
					name: "🚀 Speed Improvement",
					value: `${performance.speedImprovement}x faster`,
					inline: true,
				},
				{
					name: "💾 Local Database File",
					value: "`./data/soundy-bun.db`",
					inline: true,
				},
				{
					name: "💡 Strategy",
					value: "Turso Embedded Replicas (Local-First)",
					inline: true,
				},
				{
					name: "⏱️ Uptime",
					value: `${Math.floor(process.uptime() / 60)}m`,
					inline: true,
				},
			])
			.setFooter({
				text: "Turso Embedded Replicas provide ultra-fast local reads with native auto-syncing",
			})
			.setTimestamp();

		await ctx.editOrReply({
			embeds: [embed],
		});
	}
}
