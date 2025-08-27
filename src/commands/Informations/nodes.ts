import {
	ActionRow,
	Command,
	type CommandContext,
	type ComponentInteraction,
	Declare,
	Embed,
	LocalesT,
	StringSelectMenu,
	StringSelectOption,
} from "seyfert";
import { EmbedColors } from "seyfert/lib/common";
import { SoundyOptions, TimeFormat, formatBytes } from "#soundy/utils";
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

		const getOverviewEmbed = () => {
			return new Embed()
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
		};

		const getNodeDetailEmbed = async (nodeId: string) => {
			const node = nodes.find((n) => n.id === nodeId);
			if (!node) return getOverviewEmbed();

			const { component } = await ctx.getLocale();
			const stats = node.stats;
			const status = node.connected
				? component.nodeSelect.connected
				: component.nodeSelect.disconnected;
			return new Embed()
				.setColor(
					node.connected ? client.config.color.primary : EmbedColors.Red,
				)
				.setTitle(
					`${client.config.emoji.globe} ${component.nodeSelect.title({ node: node.id })}`,
				)
				.addFields({
					name: `${node.id} (${node.connected ? client.config.emoji.nodeOn : client.config.emoji.nodeOff})`,
					value: `\`\`\`js
${component.nodeSelect.status({ status })}
${component.nodeSelect.players({ players: stats.players })}
${component.nodeSelect.playing_players({ playingPlayers: stats.playingPlayers })}
${component.nodeSelect.uptime({ uptime: TimeFormat.toHumanize(stats.uptime) })}
${component.nodeSelect.cpu}:
	${component.nodeSelect.cores({ cores: stats.cpu.cores })}
	${component.nodeSelect.system_load({ systemLoad: (stats.cpu.systemLoad * 100).toFixed(2) })}
	${component.nodeSelect.lavalink_load({ lavalinkLoad: (stats.cpu.lavalinkLoad * 100).toFixed(2) })}
${component.nodeSelect.memory}:
	${component.nodeSelect.used({ used: formatBytes(stats.memory.used) })}
	${component.nodeSelect.reservable({ reservable: formatBytes(stats.memory.reservable) })}
\`\`\``,
				})
				.setFooter({
					text: component.nodeSelect.description,
				})
				.setTimestamp();
		};

		const getSelectMenu = () => {
			const options = nodes.map((node) =>
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
			);

			return new StringSelectMenu()
				.setCustomId("nodes-select")
				.setPlaceholder(cmd.nodes.run.description)
				.setOptions(options);
		};

		const row = new ActionRow<StringSelectMenu>().addComponents(
			getSelectMenu(),
		);

		const message = await ctx.editOrReply(
			{
				embeds: [getOverviewEmbed()],
				components: [row],
			},
			true,
		);

		const collector = message.createComponentCollector({
			filter: (i: ComponentInteraction) =>
				i.user.id === ctx.author.id && i.customId === "nodes-select",
			idle: 60000,
		});

		collector.run(/nodes-select/, async (interaction: ComponentInteraction) => {
			if (!interaction.isStringSelectMenu()) return;

			const selectedValue = interaction.values[0];
			if (!selectedValue) return;

			const newRow = new ActionRow<StringSelectMenu>().addComponents(
				getSelectMenu(),
			);
			const detailEmbed = await getNodeDetailEmbed(selectedValue);
			await interaction.update({
				embeds: [detailEmbed],
				components: [newRow],
			});
		});

		collector.stop = async (reason: string) => {
			if (reason === "idle") {
				const disabledRow = new ActionRow<StringSelectMenu>().addComponents(
					getSelectMenu().setDisabled(true),
				);
				await message.edit({
					embeds: [getOverviewEmbed()],
					components: [disabledRow],
				});
			}
		};
	}
}
