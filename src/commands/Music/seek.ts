import {
	Command,
	type CommandContext,
	createStringOption,
	Declare,
	LocalesT,
	Middlewares,
	type OKFunction,
	Options,
} from "seyfert";
import { EmbedColors } from "seyfert/lib/common";
import { SoundyCategory } from "#soundy/types";
import { ms, SoundyOptions, TimeFormat } from "#soundy/utils";

const option = {
	time: createStringOption({
		description: "Enter the time. (Ex: 2min)",
		required: true,
		locales: {
			name: "cmd.seek.options.time.name",
			description: "cmd.seek.options.time.description",
		},
		value: ({ value }, ok: OKFunction<number | string>) => {
			const time = value.split(/\s*,\s*|\s+/);
			const milis = time.map((x) => ms(x));
			const result = milis.reduce((a, b) => a + b, 0);

			if (Number.isNaN(result)) return ok(value);

			return ok(result);
		},
	}),
};

@Declare({
	name: "seek",
	description: "Seek the current track",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
	aliases: ["sk"],
})
@LocalesT("cmd.seek.name", "cmd.seek.description")
@SoundyOptions({ cooldown: 5, category: SoundyCategory.Music })
@Options(option)
@Middlewares([
	"checkNodes",
	"checkVoiceChannel",
	"checkBotVoiceChannel",
	"checkPlayer",
])
export default class SeekCommand extends Command {
	async run(ctx: CommandContext<typeof option>) {
		const { client, options, guildId } = ctx;
		const { time } = options;
		if (!guildId) return;

		const { cmd } = await ctx.getLocale();

		const player = client.manager.getPlayer(guildId);
		if (!player) return;

		const track = player.queue.current;

		if (
			typeof time === "string" ||
			Number.isNaN(time) ||
			!Number.isFinite(time)
		)
			return ctx.editOrReply({
				embeds: [
					{
						description: `${client.config.emoji.warn} ${cmd.seek.run.invalid_time}`,
						color: EmbedColors.Red,
					},
				],
			});

		if (!track?.info.isSeekable)
			return ctx.editOrReply({
				embeds: [
					{
						description: `${client.config.emoji.warn} ${cmd.seek.run.no_seekable}`,
						color: EmbedColors.Red,
					},
				],
			});

		if (time > track.info.duration)
			return ctx.editOrReply({
				embeds: [
					{
						description: `${client.config.emoji.warn} ${cmd.seek.run.time_exceeds}`,
						color: EmbedColors.Red,
					},
				],
			});

		await player.seek(time);
		await ctx.editOrReply({
			embeds: [
				{
					color: client.config.color.primary,
					description: `${client.config.emoji.yes} ${cmd.seek.run.description({ time: TimeFormat.toHumanize(time) })}`,
				},
			],
		});
	}
}
