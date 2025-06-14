import {
	ActionRow,
	Command,
	type CommandContext,
	Declare,
	Embed,
	LocalesT,
	StringSelectMenu,
	StringSelectOption,
} from "seyfert";
import { EmbedColors } from "seyfert/lib/common";
import { SoundyOptions, TimeFormat } from "#soundy/utils";
import { SoundyCategory } from "#soundy/types";

@Declare({
	name: "nodes",
	description: "Check music nodes status",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
})
@LocalesT("cmd.nodes.name", "cmd.nodes.description")
@SoundyOptions({ cooldown: 5, category: SoundyCategory.Informations })
export default class NodesCommand extends Command {
	async run(ctx: CommandContext) {
		const { client } = ctx;
		const { cmd } = await ctx.getLocale();
		const nodes = Array.from(client.manager.nodeManager.nodes.values());

		if (nodes.length === 0) {
			return ctx.editOrReply({
				embeds: [
					{
						description: `${client.config.emoji.warn} ${cmd.nodes.run.no_nodes}`,
						color: EmbedColors.Red,
					},
				],
			});
		}

		// Create initial embed with node overview
		const embed = new Embed()
			.setColor(client.config.color.primary)
			.setTitle(`${client.config.emoji.globe} ${cmd.nodes.run.title}`)
			.addFields(
				nodes.map((node) => ({
					name: `${node.connected ? client.config.emoji.nodeOn : client.config.emoji.nodeOff} ${node.id}`,
					value: cmd.nodes.run.fields({
						players: node.stats.players,
						uptime: TimeFormat.toHumanize(node.stats.uptime),
					}),
					inline: false,
				})),
			)
			.setFooter({ text: cmd.nodes.run.footer })
			.setTimestamp();

		const selectMenu = new StringSelectMenu()
			.setCustomId("nodes-select")
			.setPlaceholder(cmd.nodes.run.description)
			.setOptions(
				nodes.map((node) =>
					new StringSelectOption()
						.setLabel(node.id)
						.setDescription(
							cmd.nodes.run.status({
								status: node.connected
									? cmd.nodes.run.connected
									: cmd.nodes.run.disconnected,
							}),
						)
						.setValue(node.id)
						.setEmoji(
							node.connected
								? client.config.emoji.nodeOn
								: client.config.emoji.nodeOff,
						),
				),
			);

		const row = new ActionRow<StringSelectMenu>().addComponents(selectMenu);

		await ctx.editOrReply({
			embeds: [embed],
			components: [row],
		});
	}
}
