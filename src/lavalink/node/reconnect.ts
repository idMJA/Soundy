import { LavalinkEventTypes } from "#soundy/types";
import { createLavalinkEvent, sendNodeLog } from "#soundy/utils";

export default createLavalinkEvent({
	name: "reconnecting",
	type: LavalinkEventTypes.Node,
	async run(client, node) {
		const nodeType = node.isNodeLink() ? "NodeLink" : "Lavalink";
		client.logger.info(`[Music] Node ${node.id} (${nodeType}) Reconnecting...`);
		await sendNodeLog(client, "reconnecting", node).catch((err) =>
			client.logger.error(
				`[Music] Failed to send node reconnect webhook: ${err}`,
			),
		);
	},
});
