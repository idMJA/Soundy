import "@dotenvx/dotenvx/config";
import Soundy from "#soundy/client";
import { Logger } from "seyfert";
import { SoundyLogger, validateEnv, validateConfig } from "#soundy/utils";
import { APIServer } from "#soundy/api";

Logger.customize(SoundyLogger);

validateEnv();
validateConfig();

const client = new Soundy();
APIServer(client);

export default client;
