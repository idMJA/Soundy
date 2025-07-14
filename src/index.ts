import "@dotenvx/dotenvx/config";
import Soundy from "#soundy/client";
import { Logger } from "seyfert";
import { SoundyLogger, validateEnv } from "#soundy/utils";
import { APIServer } from "#soundy/api";

Logger.customize(SoundyLogger);

validateEnv();

const client = new Soundy();
(async () => {
	await APIServer(client);
})();

export default client;
