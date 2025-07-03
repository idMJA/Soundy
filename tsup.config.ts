import { type Options, defineConfig } from "tsup";

export default defineConfig((options: Options) => ({
	entryPoints: ["src/**/*.ts"],
	clean: true,
	format: "cjs",
	legacyOutput: true,
	...options,
}));
