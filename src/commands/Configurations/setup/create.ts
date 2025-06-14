import {
	ActionRow,
	Button,
	type CommandContext,
	Declare,
	LocalesT,
	SubCommand,
} from "seyfert";
import {
	ButtonStyle,
	ChannelType,
	MessageFlags,
	OverwriteType,
	PermissionFlagsBits,
} from "seyfert/lib/types";

@Declare({
	name: "create",
	description: "Create a music request channel",
})
@LocalesT("cmd.setup.sub.create.name", "cmd.setup.sub.create.description")
export default class CreateSubcommand extends SubCommand {
	async run(ctx: CommandContext) {
		const { client, guildId } = ctx;
		if (!guildId) return;

		const { cmd, event } = await ctx.getLocale();

		const existingSetup = await client.database.getSetup(guildId);

		if (existingSetup) {
			await ctx.editOrReply({
				embeds: [
					{
						color: client.config.color.no,
						description: `${client.config.emoji.no} ${cmd.setup.sub.create.run.exists}`,
					},
				],
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const guild = await ctx.guild();
		if (!guild) return;

		// Create the channel
		const channel = await guild.channels.create({
			name: "🎧・soundy-music",
			type: ChannelType.GuildText,
			topic: cmd.setup.sub.create.run.topic,
			permission_overwrites: [
				{
					id: client.me.id,
					type: OverwriteType.Member,
					allow: (
						PermissionFlagsBits.ViewChannel |
						PermissionFlagsBits.SendMessages |
						PermissionFlagsBits.EmbedLinks |
						PermissionFlagsBits.ReadMessageHistory |
						PermissionFlagsBits.ManageMessages
					).toString(),
				},
				{
					id: guildId,
					type: OverwriteType.Role,
					allow: (
						PermissionFlagsBits.ViewChannel |
						PermissionFlagsBits.SendMessages |
						PermissionFlagsBits.ReadMessageHistory
					).toString(),
				},
			],
		});

		// Create the control buttons
		const row1 = new ActionRow<Button>().addComponents(
			new Button()
				.setCustomId("player-shuffle")
				.setStyle(ButtonStyle.Secondary)
				.setEmoji(client.config.emoji.shuffle)
				.setDisabled(true),
			new Button()
				.setCustomId("player-previous")
				.setStyle(ButtonStyle.Secondary)
				.setEmoji(client.config.emoji.previous)
				.setDisabled(true),
			new Button()
				.setCustomId("player-pause")
				.setStyle(ButtonStyle.Secondary)
				.setEmoji(client.config.emoji.pause)
				.setDisabled(true),
			new Button()
				.setCustomId("player-skip")
				.setStyle(ButtonStyle.Secondary)
				.setEmoji(client.config.emoji.skip)
				.setDisabled(true),
			new Button()
				.setCustomId("player-loop")
				.setStyle(ButtonStyle.Secondary)
				.setEmoji(client.config.emoji.loop)
				.setDisabled(true),
		);

		const row2 = new ActionRow<Button>().addComponents(
			new Button()
				.setCustomId("player-clear")
				.setStyle(ButtonStyle.Secondary)
				.setEmoji(client.config.emoji.trash)
				.setDisabled(true),
			new Button()
				.setCustomId("player-voldown")
				.setStyle(ButtonStyle.Secondary)
				.setEmoji(client.config.emoji.volDown)
				.setDisabled(true),
			new Button()
				.setCustomId("player-stop")
				.setStyle(ButtonStyle.Danger)
				.setEmoji(client.config.emoji.stop)
				.setDisabled(true),
			new Button()
				.setCustomId("player-volup")
				.setStyle(ButtonStyle.Secondary)
				.setEmoji(client.config.emoji.volUp)
				.setDisabled(true),
			new Button()
				.setCustomId("player-queue")
				.setStyle(ButtonStyle.Secondary)
				.setEmoji(client.config.emoji.list)
				.setDisabled(true),
		);

		// Create the setup message
		const setupMessage = await client.messages.write(channel.id, {
			embeds: [
				{
					title: `${client.config.emoji.music} ${event.setup.title}`,
					description: event.setup.description,
					image: { url: client.config.info.banner },
					color: client.config.color.primary,
					timestamp: new Date().toISOString(),
				},
			],
			components: [row1, row2],
		});

		if (!setupMessage) {
			await ctx.editOrReply({
				embeds: [
					{
						color: client.config.color.no,
						description: `${client.config.emoji.no} ${cmd.setup.sub.create.run.failed}`,
					},
				],
			});
			return;
		}

		// Save the setup in database
		await client.database.createSetup(guildId, channel.id, setupMessage.id);

		await ctx.editOrReply({
			embeds: [
				{
					color: client.config.color.yes,
					description: `${client.config.emoji.yes} ${cmd.setup.sub.create.run.success({ channel: channel.toString() })}`,
				},
			],
		});
	}
}
