import "@dotenvx/dotenvx/config";
import { Logger } from "seyfert";
import { APIServer } from "#soundy/api";
import Soundy from "#soundy/client";
import { SoundyLogger, validateConfig, validateEnv } from "#soundy/utils";

Logger.customize(SoundyLogger);

validateEnv();
validateConfig();

const client = new Soundy();
APIServer(client);

export default client;
