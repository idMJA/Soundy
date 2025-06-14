import { LavalinkEventTypes } from "#soundy/types";
import { createLavalinkEvent } from "#soundy/utils";

export default createLavalinkEvent({
	name: "debug",
	type: LavalinkEventTypes.Manager,
	run(client, message: unknown) {
		client.logger.info("Lavalink debug event received:", message);
	},
});
