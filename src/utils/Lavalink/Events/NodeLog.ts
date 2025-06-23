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
	// Define color based on the type
	let color = 0x00ff00; // Green for connected
	if (type === "disconnected" || type === "error" || type === "track-error")
		color = 0xff0000; // Red for errors
	if (type === "reconnecting") color = 0xffff00; // Yellow for reconnecting

	// Create embed
	const embed = new Embed().setColor(color).setTimestamp();

	// Set title and description based on type
	switch (type) {
		case "connected":
			embed.setTitle("🟢 Node Connected");
			embed.setDescription(`Node **${node.id}** has successfully connected.`);
			break;
		case "disconnected":
			embed.setTitle("🔴 Node Disconnected");
			embed.setDescription(`Node **${node.id}** has disconnected.`);
			break;
		case "error":
			embed.setTitle("❌ Node Error");
			embed.setDescription(`Node **${node.id}** encountered an error.`);
			// Add error details if available
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
			embed.setTitle("🟡 Node Reconnecting");
			embed.setDescription(`Node **${node.id}** is attempting to reconnect.`);
			break;
		case "track-error":
			embed.setTitle("❌ Track Error");
			embed.setDescription(`A track error occurred in server **${node.id}**.`);
			if (data && "exception" in data && "track" in data) {
				const trackData = data.track as LavalinkTrack;
				const exception = data.exception;

				// Format track details
				const trackInfo = [
					`**Track**: ${trackData.info.title || "Unknown"}`,
					`**Author**: ${trackData.info.author || "Unknown"}`,
					`**Cluster**: [Shard ${node.options.id?.split("-")[1] || 0}]`,
				];

				embed.setDescription(trackInfo.join("\n"));

				// Add detailed track info field
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

				// Add server ID as footer
				embed.setFooter({
					text: `Server ID: ${node.id} | Track ID: ${trackData.info.identifier || "unknown"}`,
				});
			}
			break;
	}

	// Add Node details for non-track errors
	if (type !== "track-error") {
		embed.addFields([
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
