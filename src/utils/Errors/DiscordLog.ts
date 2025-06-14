import { Embed } from "seyfert";
import type Soundy from "#soundy/client";
import { Configuration } from "#soundy/config";

/**
 * Send error log to webhook
 * @param client - The client instance
 * @param error - The error object
 * @param context - Additional context information
 * @returns Promise<Response> - The webhook response
 */
export async function sendErrorLog(
	client: Soundy,
	error: Error,
	context?: string,
): Promise<Response> {
	const fields = [
		{
			name: "Error Name",
			value: error.name,
			inline: true,
		},
		{
			name: "Timestamp",
			value: new Date().toISOString(),
			inline: true,
		},
	];

	if (context) {
		fields.push({
			name: "Context",
			value: context,
			inline: false,
		});
	}

	const embed = new Embed()
		.setColor(Configuration.color.no)
		.setTitle("❌ Error Occurred")
		.setDescription(
			`\`\`\`\n${error.stack?.slice(0, 4000) ?? error.message}\`\`\``,
		)
		.addFields(fields)
		.setTimestamp();

	return await fetch(`${client.config.webhooks.errorLog}?wait=true`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			username: "Soundy Error Logger",
			avatar_url: client.me.avatarURL(),
			embeds: [embed.toJSON()],
		}),
	});
}
