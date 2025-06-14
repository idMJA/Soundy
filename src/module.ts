import type Soundy from "./client/Soundy";
import type { LavalinkManager } from "lavalink-client";
import type { ParseClient, ParseLocales, ParseMiddlewares } from "seyfert";
import type { SoundyMiddlewares } from "#soundy/middlewares";
import type { SoundyContext } from "#soundy/utils";
import type { Options } from "#soundy/types";
import type English from "./locales/en-US";

declare module "seyfert" {
	interface Command extends Options {}
	interface SubCommand extends Options {}
	interface ComponentCommand extends Options {}
	interface ModalCommand extends Options {}
	interface ContextMenuCommand extends Options {}
	interface EntryPointCommand extends Options {}

	interface UsingClient extends ParseClient<Soundy> {}
	interface ExtendContext extends ReturnType<typeof SoundyContext> {}
	interface RegisteredMiddlewares
		extends ParseMiddlewares<typeof SoundyMiddlewares> {}
	interface GlobalMetadata extends ParseMiddlewares<typeof SoundyMiddlewares> {}
	interface DefaultLocale extends ParseLocales<typeof English> {}

	interface Client {
		lavalink: LavalinkManager;
	}

	interface ExtendedRCLocations {
		lavalink: string;
	}

	interface InternalOptions {
		withPrefix: true;
	}
}
