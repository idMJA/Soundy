import { LavalinkEventTypes } from "#soundy/types";
import { createLavalinkEvent, getDepth, sendNodeLog } from "#soundy/utils";

interface ConnectionError extends Error {
	code?: string;
}

export default createLavalinkEvent({
	name: "error",
	type: LavalinkEventTypes.Node,
	async run(client, node, error: ConnectionError) {
		client.logger.error(
			`[Music] Node ${node.id} has an error. Error: ${getDepth(error)}`,
		);

		try {
			await sendNodeLog(client, "error", node, error);
		} catch (webhookError) {
			client.logger.error(
				`[Music] Failed to send node error webhook: ${webhookError}`,
			);
		}

		if (
			error.code === "ECONNREFUSED" ||
			error.code === "ECONNRESET" ||
			error.code === "ETIMEDOUT"
		) {
			client.logger.warn(
				`[Music] Node ${node.id} connection error, attempting to reconnect in 5s...`,
			);

			setTimeout(async () => {
				try {
					node.connect();
					client.logger.info(
						`[Music] Node ${node.id} reconnection attempt initiated`,
					);
				} catch (reconnectError) {
					client.logger.error(
						`[Music] Node ${node.id} reconnection failed`,
						reconnectError,
					);

					const backoffTime = Math.min(5000, 30000);
					client.logger.warn(
						`[Music] Node ${node.id} will try again in ${backoffTime / 1000}s...`,
					);
					setTimeout(() => node.connect(), backoffTime);
				}
			}, 5000);
		}
	},
});
