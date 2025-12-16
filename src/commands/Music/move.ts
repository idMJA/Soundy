import {
	Command,
	type CommandContext,
	createChannelOption,
	Declare,
	LocalesT,
	Middlewares,
	Options,
} from "seyfert";
import { ChannelType } from "seyfert/lib/types";
import { SoundyCategory } from "#soundy/types";
import { SoundyOptions } from "#soundy/utils";

const option = {
	voice: createChannelOption({
		description: "Select the voice channel.",
		channel_types: [ChannelType.GuildVoice],
		required: true,
		locales: {
			name: "cmd.move.options.voice.name",
			description: "cmd.move.options.voice.description",
		},
	}),
	text: createChannelOption({
		description: "Select the text channel.",
		channel_types: [ChannelType.GuildText],
		locales: {
			name: "cmd.move.options.text.name",
			description: "cmd.move.options.text.description",
		},
	}),
};

@Declare({
	name: "move",
	description: "Move the player to a different voice channel",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
	aliases: ["mov", "m"],
})
@LocalesT("cmd.move.name", "cmd.move.description")
@SoundyOptions({ cooldown: 5, category: SoundyCategory.Music })
@Options(option)
@Middlewares(["checkNodes", "checkVoiceChannel", "checkPlayer"])
export default class MoveCommand extends Command {
	async run(ctx: CommandContext<typeof option>) {
		const { client, options, guildId } = ctx;
		const { voice, text } = options;

		const { cmd } = await ctx.getLocale();

		if (!guildId) return;

		const player = client.manager.getPlayer(guildId);
		if (!player) return;

		if (text) {
			player.options.textChannelId = text.id;
			player.textChannelId = text.id;
		}

		player.options.voiceChannelId = voice.id;
		player.voiceChannelId = voice.id;

		await player.connect();
		await ctx.editOrReply({
			embeds: [
				{
					color: client.config.color.primary,
					description: cmd.move.run.description({
						voiceChannel: `<#${voice.id}>`,
						textChannel: text?.id ? `<#${text.id}>` : "",
					}),
				},
			],
		});
	}
}
