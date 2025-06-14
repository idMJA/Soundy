import { LavalinkEventTypes } from "#soundy/types";
import { createLavalinkEvent, sendNodeLog } from "#soundy/utils";

export default createLavalinkEvent({
	name: "disconnect",
	type: LavalinkEventTypes.Node,
	async run(client, node) {
		client.logger.info(`[Music] Node ${node.id} Disconnected`);
		await sendNodeLog(client, "disconnected", node).catch((err) =>
			client.logger.error(
				`[Music] Failed to send node disconnect webhook: ${err}`,
			),
		);
	},
});
