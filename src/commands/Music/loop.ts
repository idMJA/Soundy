import {
	Command,
	type CommandContext,
	Declare,
	LocalesT,
	Middlewares,
} from "seyfert";
import { SoundyOptions } from "#soundy/utils";
import { SoundyCategory } from "#soundy/types";

@Declare({
	name: "loop",
	description: "Toggle the loop mode",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
	aliases: ["l"],
})
@LocalesT("cmd.loop.name", "cmd.loop.description")
@SoundyOptions({ cooldown: 5, category: SoundyCategory.Music })
@Middlewares([
	"checkNodes",
	"checkVoiceChannel",
	"checkBotVoiceChannel",
	"checkPlayer",
])
export default class LoopCommand extends Command {
	async run(ctx: CommandContext) {
		const { client, guildId } = ctx;
		if (!guildId) return;

		const { component } = await ctx.getLocale();

		const player = client.manager.getPlayer(guildId);
		if (!player) return;

		// Toggle loop mode: off -> track -> queue -> off
		let newMode: "off" | "track" | "queue";
		if (player.repeatMode === "off") newMode = "track";
		else if (player.repeatMode === "track") newMode = "queue";
		else newMode = "off";
		await player.setRepeatMode(newMode);

		// Respond with the current loop mode
		let currentMode = "";
		switch (newMode) {
			case "off":
				currentMode = component.loop.loop_off;
				break;
			case "track":
				currentMode = component.loop.loop_track;
				break;
			case "queue":
				currentMode = component.loop.loop_queue;
				break;
		}

		await ctx.editOrReply({
			embeds: [
				{
					title: `${client.config.emoji.loop} ${component.loop.title}`,
					description: `${currentMode}\n\n${component.loop.description}`,
					color: client.config.color.primary,
				},
			],
			components: [],
		});
	}
}
