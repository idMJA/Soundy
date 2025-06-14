import {
	Command,
	type CommandContext,
	Declare,
	LocalesT,
	Middlewares,
	Options,
	createIntegerOption,
} from "seyfert";
import { SoundyOptions } from "#soundy/utils";
import { SoundyCategory } from "#soundy/types";

const option = {
	volume: createIntegerOption({
		description: "Enter the volume.",
		required: true,
		min_value: 0,
		max_value: 100,
		locales: {
			name: "cmd.volume.options.volume.name",
			description: "cmd.volume.options.volume.description",
		},
	}),
};

@Declare({
	name: "volume",
	description: "Adjust the player volume",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
	aliases: ["v", "vol"],
})
@LocalesT("cmd.volume.name", "cmd.volume.description")
@SoundyOptions({ cooldown: 5, category: SoundyCategory.Music })
@Options(option)
@Middlewares([
	"checkNodes",
	"checkVoiceChannel",
	"checkBotVoiceChannel",
	"checkPlayer",
])
export default class VolumeCommand extends Command {
	async run(ctx: CommandContext<typeof option>): Promise<void> {
		const { client, guildId, options } = ctx;
		if (!guildId) return;

		const { cmd, component } = await ctx.getLocale();

		const player = client.manager.getPlayer(guildId);
		if (!player) return;

		const volume = Math.max(0, Math.min(150, options.volume));
		await player.setVolume(volume);

		await ctx.editOrReply({
			embeds: [
				{
					title: `${client.config.emoji.pause} ${cmd.volume.run.paused}`,
					description: cmd.volume.run.paused_description,
					color: client.config.color.primary,
				},
			],
		});

		// Resume player if it was paused and volume > 1
		if (volume > 1 && player.paused) {
			await player.resume();
		}

		await player.setVolume(volume);
		await ctx.editOrReply({
			embeds: [
				{
					description: `${client.config.emoji.volUp} ${component.volume.description({ volume: `**${volume}%**` })}`,
					color: client.config.color.primary,
				},
			],
		});
	}
}
