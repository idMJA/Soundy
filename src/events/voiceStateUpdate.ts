import { createEvent } from "seyfert";
import { playerListener } from "#soundy/utils";

export default createEvent({
	data: { name: "voiceStateUpdate" },
	async run([newState, oldState], client): Promise<void> {
		await playerListener(client, newState, oldState);
	},
});
