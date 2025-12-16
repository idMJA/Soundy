import {
	Command,
	type CommandContext,
	Declare,
	Embed,
	LocalesT,
} from "seyfert";
import { SoundyCategory } from "#soundy/types";
import { SoundyOptions } from "#soundy/utils";

@Declare({
	name: "ping",
	description: "Check the bot's latency and API response time",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
})
@LocalesT("cmd.ping.name", "cmd.ping.description")
@SoundyOptions({ cooldown: 5, category: SoundyCategory.Informations })
export default class PingCommand extends Command {
	async run(ctx: CommandContext): Promise<void> {
		const { client } = ctx;

		const { cmd } = await ctx.getLocale();

		const embed = new Embed()
			.setColor(client.config.color.primary)
			.setTitle(`${client.config.emoji.ping} ${cmd.ping.run.check_title}`)
			.setDescription(cmd.ping.run.check_description)
			.setTimestamp();

		await ctx.editOrReply({ embeds: [embed] });

		const wsPing = Math.floor(client.gateway.latency);
		const createdTimestamp =
			ctx.message?.createdTimestamp ?? ctx.interaction?.createdTimestamp;
		const clientPing = createdTimestamp
			? Math.floor(Date.now() - createdTimestamp)
			: 0;
		const shardPing = Math.floor(
			(await ctx.client.gateway.get(ctx.shardId)?.ping()) ?? 0,
		);

		embed
			.setColor(client.config.color.primary)
			.setTitle(`${client.config.emoji.ping} Connection Status`)
			.setDescription(
				`${client.config.emoji.globe} **${cmd.ping.run.description[1]}:** \`${wsPing}ms\`\n` +
					`${client.config.emoji.slash} **${cmd.ping.run.description[2]}:** \`${clientPing}ms\`\n` +
					`${client.config.emoji.info} **${cmd.ping.run.description[3]}:** \`${shardPing}ms\``,
			);

		await ctx.editOrReply({ embeds: [embed] });
	}
}
