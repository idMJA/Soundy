import type { Command, ContextMenuCommand, SubCommand } from "seyfert";
import type { PermissionFlagsBits } from "seyfert/lib/types";

export type PermissionNames = keyof typeof PermissionFlagsBits;
export type AutoplayMode = "enabled" | "disabled";
export type PausedMode = "pause" | "resume";
export type NonGlobalCommands = Command | ContextMenuCommand | SubCommand;

// Core types
export * from "./core/Category";
export * from "./core/Configuration";
export * from "./core/Keys";

// Lavalink types
export * from "./Lavalink/Lavalink";

// API/Options types
export * from "./api/Options";
