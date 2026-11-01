import { readFileSync } from "node:fs";
import { join } from "node:path";
import pino from "pino";
import { Logger } from "seyfert";
import { italic, LogLevels, rgb24 } from "seyfert/lib/common";
import { Configuration } from "#soundy/config";

/**
 * Pino Logger instance.
 */
export const pinoLogger = pino({
	level: process.env.LOG_LEVEL || "info",
	transport:
		process.env.NODE_ENV !== "production"
			? {
					target: "pino-pretty",
					options: {
						colorize: true,
						translateTime: "SYS:yyyy-mm-dd HH:MM:ss",
						ignore: "pid,hostname",
					},
				}
			: undefined,
});

function formatLogArg(arg: unknown): string {
	if (
		arg instanceof Error ||
		(typeof arg === "object" &&
			arg !== null &&
			"message" in arg &&
			("stack" in arg || "name" in arg))
	) {
		const err = arg as Error;
		return err.stack || `${err.name || "Error"}: ${err.message}`;
	}
	if (typeof arg === "object" && arg !== null) {
		try {
			const json = JSON.stringify(arg);
			if (json === "{}" && "message" in arg) {
				return String((arg as { message: unknown }).message);
			}
			return json;
		} catch {
			return String(arg);
		}
	}
	return String(arg);
}

/**
 * Redirect Seyfert internal logger events to Pino.
 */
Logger.customize((_this, level, args) => {
	const message = args.map(formatLogArg).join(" ");

	switch (level) {
		case LogLevels.Debug:
			pinoLogger.debug(message);
			break;
		case LogLevels.Info:
			pinoLogger.info(message);
			break;
		case LogLevels.Warn:
			pinoLogger.warn(message);
			break;
		case LogLevels.Error:
			pinoLogger.error(message);
			break;
		case LogLevels.Fatal:
			pinoLogger.fatal(message);
			break;
	}

	return undefined;
});

/**
 *
 * Custom color function.
 */
const customColor = (text: string) => rgb24(text, Configuration.color.primary);

/**
 *
 * Send ascii text.
 * @returns
 */
export function getWatermark(): void {
	const logoPath = join(process.cwd(), "src", "utils", "Common", "logo.txt");
	const logo = readFileSync(logoPath, "utf-8");

	console.info(
		customColor(`

${logo}
                                                           
        
           ${italic(`→   ${getRandomText()}`)}
    `),
	);
}

/**
 *
 * Get a random text to make it more lively...?
 * @returns
 */
function getRandomText(): string {
	const texts = [
		"Let the music play~",
		"Soundy's melody magic!",
		"Rhythm and beats with Soundy!",
		"Your musical companion!",
		"Dropping beats with style!",
		"Soundy's harmony helper!",
		"Music to your ears!",
		"Soundy's sound sanctuary!",
		"Vibing with Soundy!",
		"Your DJ assistant!",
		"Soundy's musical magic!",
		"Bringing the beats!",
		"Soundy's sound waves!",
		"Music made easy!",
		"Harmony with Soundy!",
		"Beats from the heart!",
		"Soundy's rhythm realm!",
		"Musical help, Soundy way!",
		"Express your sound!",
		"Soundy's musical aid!",
		"Melodies for everyone!",
		"Soundy's smooth tunes!",
		"Musical support, Soundy style!",
		"Discord's best DJ!",
		"Musical aid from Soundy!",
		"Rhythm express!",
		"Soundy's musical care!",
		"Support with a beat!",
		"Soundy's playlist power!",
		"Musical help, Soundy touch!",
		"Help from the beats!",
	];

	return texts[Math.floor(Math.random() * texts.length)] ?? "";
}

/**
 * Standard logger instance export.
 */
export const logger = pinoLogger;
