import type { BaseCommand } from "seyfert";
import type { NonCommandOptions, Options } from "#soundy/types";

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
type Instantiable<T> = new (...arg: any[]) => T;

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function SoundyOptions<A extends Instantiable<any>>(
	options: A extends Instantiable<BaseCommand> ? Options : NonCommandOptions,
) {
	return (target: A) =>
		class extends target {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			constructor(...args: any[]) {
				super(...args);
				Object.assign(this, options);
			}
		};
}
