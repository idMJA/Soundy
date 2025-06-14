import { PlayerSaver } from "#soundy/utils";
import { LavalinkEventTypes } from "#soundy/types";
import { createLavalinkEvent, sendNodeLog } from "#soundy/utils";

export default createLavalinkEvent({
	name: "connect",
	type: LavalinkEventTypes.Node,
	async run(client, node) {
		client.logger.info(`[Music] Node ${node.id} Connected`);

		if (!node.sessionId) return;
		try {
			const playerSaver = new PlayerSaver(client.logger);
			await playerSaver.saveNodeSession(node.options.host, node.sessionId);
			client.logger.info(`[Music] Saved session ID for node ${node.id}`);
		} catch (err) {
			client.logger.error("[Music] Failed to save node session ID:", err);
		}

		await sendNodeLog(client, "connected", node).catch((err) =>
			client.logger.error(
				`[Music] Failed to send node connect webhook: ${err}`,
			),
		);

		// Explicitly enable session resuming for the node
		try {
			await node.updateSession(true, 360e3); // enable resuming for playback of up to 360s
			client.logger.info(
				`[Music] Session resuming enabled for node ${node.id}`,
			);
		} catch (error) {
			client.logger.error(
				`[Music] Failed to enable session resuming for node ${node.id}:`,
				error,
			);
		}
	},
});
