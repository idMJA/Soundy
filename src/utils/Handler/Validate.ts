import { Logger } from "seyfert";
import { Configuration } from "#soundy/config";
import { InvalidEnvValue } from "#soundy/utils";
import type { SoundyWebhooks } from "#soundy/types";

const logger = new Logger({
	name: "[ENV]",
});

/**
 *
 * Validate Soundy environment variables.
 * @returns
 */
export function validateEnv() {
	logger.info("Validating '.env' file variables...");

	const createMessage = (variable: string) =>
		`The variable: '${variable}' in the '.env' cannot be empty or undefined.`;

	if (!process.env.TOKEN) throw new InvalidEnvValue(createMessage("TOKEN"));
	if (!process.env.DATABASE_URL)
		throw new InvalidEnvValue(createMessage("DATABASE_URL"));
	if (!process.env.DATABASE_PASSWORD)
		throw new InvalidEnvValue(createMessage("DATABASE_PASSWORD"));

	return logger.info("All required environment variables are present.");
}

/**
 * Validate the `Configuration` object variables.
 * @returns
 */
export function validateConfig() {
	logger.info("Validating 'src/config/config.ts' contents...");

	const createMessage = (variable: string) =>
		`The configuration value '${variable}' in 'src/config/config.ts' is missing or invalid.`;

	const isUnset = (v: unknown) => {
		if (v === undefined || v === null) return true;
		if (typeof v === "string") {
			const s = v.trim().toLowerCase();
			return s === "" || s === "xxx";
		}
		return false;
	};

	if (!Configuration) {
		throw new InvalidEnvValue(createMessage("Configuration"));
	}

	if (isUnset(Configuration.defaultPrefix)) {
		throw new InvalidEnvValue(createMessage("Configuration.defaultPrefix"));
	}

	if (
		Configuration.serverPort === undefined ||
		Configuration.serverPort === null ||
		typeof Configuration.serverPort !== "number"
	) {
		throw new InvalidEnvValue(createMessage("Configuration.serverPort"));
	}

	if (Configuration.topgg?.enabled) {
		if (isUnset(Configuration.topgg?.token)) {
			throw new InvalidEnvValue(createMessage("Configuration.topgg.token"));
		}
	}

	if (!Configuration.cache || isUnset(Configuration.cache.filename)) {
		throw new InvalidEnvValue(createMessage("Configuration.cache.filename"));
	}

	const webhookKeys = [
		"nodeLog",
		"guildLog",
		"commandLog",
		"voteLog",
		"errorLog",
		"report",
	];

	if (!Configuration.webhooks) {
		throw new InvalidEnvValue(createMessage("Configuration.webhooks"));
	}

	const webhooks = Configuration.webhooks as SoundyWebhooks;
	for (const key of webhookKeys as Array<keyof SoundyWebhooks>) {
		const val = webhooks[key];
		if (isUnset(val)) {
			throw new InvalidEnvValue(createMessage(`Configuration.webhooks.${key}`));
		}
	}

	logger.info("Configuration validation passed.");
}
