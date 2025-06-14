import { checkCooldown } from "./commands/cooldown";
import {
	checkNodes,
	checkPlayer,
	checkQueue,
	checkTracks,
} from "./commands/manager";
import { checkPremium } from "./commands/premium";
import { checkVerifications } from "./commands/verifications";
import {
	checkBotVoiceChannel,
	checkVoiceChannel,
	checkVoicePermissions,
} from "./commands/voice";

export const SoundyMiddlewares = {
	// Main middlewares
	checkCooldown,
	checkVerifications,
	checkPremium,

	// Voice middlewares
	checkBotVoiceChannel,
	checkVoiceChannel,

	// Manager middlewares
	checkQueue,
	checkNodes,
	checkPlayer,
	checkTracks,

	// Permissions middlewares
	checkVoicePermissions,
} as const;
