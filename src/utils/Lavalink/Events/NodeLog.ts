import type {
	LavalinkNode,
	LavalinkTrack,
	TrackExceptionEvent,
} from "lavalink-client";
import { Embed, type UsingClient } from "seyfert";
import { formatTrackInfo } from "#soundy/utils";

/**
 * Send node log to webhook
 * @param client - The client instance
 * @param type - The type of log (connected, disconnected, error, reconnecting, track-error)
 * @param node - The node instance
 * @param data - Additional data for the log (error, track info, etc.)
 * @returns Promise<Response> - The webhook response
 */
export async function sendNodeLog(
	client: UsingClient,
	type: "connected" | "disconnected" | "error" | "reconnecting" | "track-error",
	node: LavalinkNode,
	data?: Error | TrackExceptionEvent,
): Promise<Response> {
	const nodeType = node.isNodeLink() ? "NodeLink" : "Lavalink";

	let color = 0x00ff00;
	if (type === "disconnected" || type === "error" || type === "track-error")
		color = 0xff0000;
	if (type === "reconnecting") color = 0xffff00;

	const embed = new Embed().setColor(color).setTimestamp();

	switch (type) {
		case "connected":
			embed.setTitle(`🟢 Node Connected (${nodeType})`);
			embed.setDescription(
				`Node **${node.id}** (${nodeType}) has successfully connected.`,
			);
			break;
		case "disconnected":
			embed.setTitle(`🔴 Node Disconnected (${nodeType})`);
			embed.setDescription(
				`Node **${node.id}** (${nodeType}) has disconnected.`,
			);
			break;
		case "error":
			embed.setTitle(`❌ Node Error (${nodeType})`);
			embed.setDescription(
				`Node **${node.id}** (${nodeType}) encountered an error.`,
			);

			if (data && data instanceof Error) {
				embed.addFields([
					{
						name: "Error Type",
						value: data.name,
						inline: true,
					},
					{
						name: "Error Message",
						value: data.message || "No message",
						inline: true,
					},
				]);
				if (data.stack) {
					embed.addFields([
						{
							name: "Stack Trace",
							value: `\`\`\`\n${data.stack.slice(0, 1000)}\n\`\`\``,
							inline: false,
						},
					]);
				}
			}
			break;
		case "reconnecting":
			embed.setTitle(`🟡 Node Reconnecting (${nodeType})`);
			embed.setDescription(
				`Node **${node.id}** (${nodeType}) is attempting to reconnect.`,
			);
			break;
		case "track-error":
			embed.setTitle(`❌ Track Error (${nodeType})`);
			embed.setDescription(
				`A track error occurred in server **${node.id}** (${nodeType}).`,
			);
			if (data && "exception" in data && "track" in data) {
				const trackData = data.track as LavalinkTrack;
				const exception = data.exception;

				const trackInfo = [
					`**Track**: ${trackData.info.title || "Unknown"}`,
					`**Author**: ${trackData.info.author || "Unknown"}`,
					`**Cluster**: [Shard ${node.options.id?.split("-")[1] || 0}]`,
				];

				embed.setDescription(trackInfo.join("\n"));

				embed.addFields([
					{
						name: "Track Details",
						value: formatTrackInfo(trackData),
						inline: false,
					},
					{
						name: "Error",
						value: `\`\`\`\n${exception?.message || "Unknown error"}\n\`\`\``,
						inline: false,
					},
				]);

				embed.setFooter({
					text: `Server ID: ${node.id} | Track ID: ${trackData.info.identifier || "unknown"}`,
				});
			}
			break;
	}

	if (type !== "track-error") {
		embed.addFields([
			{
				name: "Type",
				value: nodeType,
				inline: true,
			},
			{
				name: "Host",
				value: `\`${node.options.host}\``,
				inline: true,
			},
			{
				name: "Cluster",
				value: `[Shard ${node.options.id?.split("-")[1] || 0}]`,
				inline: true,
			},
		]);
	}

	return await fetch(client.config.webhooks.nodeLog, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			username: "Soundy Node Logger",
			avatar_url: client.me.avatarURL(),
			embeds: [embed.toJSON()],
		}),
	});
}
