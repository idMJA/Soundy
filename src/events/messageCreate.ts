import { createEvent } from "seyfert";
import { playerSetup } from "#soundy/utils";

export default createEvent({
	data: { name: "messageCreate" },
	async run(message, client) {
		await playerSetup(message, client);
	},
});
