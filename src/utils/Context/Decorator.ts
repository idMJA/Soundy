import type { BaseCommand } from "seyfert";
import type { NonCommandOptions, Options } from "#soundy/types";

// biome-ignore lint/suspicious/noExplicitAny: This type is generic and must accept any constructor arguments for flexibility.
type Instantiable<T> = new (...arg: any[]) => T;

// biome-ignore lint/suspicious/noExplicitAny: This decorator must accept any class type for broad compatibility with command and non-command classes.
export function SoundyOptions<A extends Instantiable<any>>(
	options: A extends Instantiable<BaseCommand> ? Options : NonCommandOptions,
) {
	return (target: A) =>
		class extends target {
			// biome-ignore lint/suspicious/noExplicitAny: The constructor must accept any arguments to support all possible base class signatures.
			constructor(...args: any[]) {
				super(...args);
				Object.assign(this, options);
			}
		};
}
