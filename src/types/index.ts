import type { Command, ContextMenuCommand, SubCommand } from "seyfert";
import type { APIUser, PermissionFlagsBits } from "seyfert/lib/types";

export type PermissionNames = keyof typeof PermissionFlagsBits;
export type AutoplayMode = "enabled" | "disabled";
export type PausedMode = "pause" | "resume";
export type NonGlobalCommands = Command | ContextMenuCommand | SubCommand;
export type SoundyUser = APIUser & { tag: string };

// Core types
export * from "./core/Category";
export * from "./core/Configuration";
export * from "./core/Keys";

// Lavalink types
export * from "./lavalink/Lavalink";
export * from "./lavalink/PlayerSaver";

// API/Options types
export * from "./api/Options";
