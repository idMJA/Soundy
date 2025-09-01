import {
	ActionRow,
	Button,
	StringSelectMenu,
	type AnyContext,
	type ButtonInteraction,
	type Embed,
	type Message,
	type StringSelectMenuInteraction,
	type WebhookMessage,
} from "seyfert";
import {
	ButtonStyle,
	MessageFlags,
	type APIActionRowComponent,
	type APIButtonComponentWithCustomId,
	type APIMessageActionRowComponent,
} from "seyfert/lib/types";
import {
	EmbedColors,
	type Awaitable,
	type InteractionCreateBodyRequest,
	type InteractionMessageUpdateBodyRequest,
} from "seyfert/lib/common";
import {
	InvalidComponentRun,
	InvalidEmbedsLength,
	InvalidMessage,
	InvalidPageNumber,
} from "#soundy/utils";

/**
 * Soundy button class.
 */
export class SoundyButton extends Button {
	/**
	 * The function to run when the button is clicked.
	 */
	public run!: (
		interaction: ButtonInteraction,
		setPage: (n: number) => void,
	) => Awaitable<unknown>;

	/**
	 * The data of the button.
	 */
	declare data: APIButtonComponentWithCustomId;

	/**
	 *
	 * The function to run when the button is clicked.
	 * @param run The function to run when the button is clicked.
	 * @returns
	 */
	public setRun(run: SoundyButton["run"]): this {
		this.run = run;
		return this;
	}
}

/**
 * Soundy string menu class.
 */
export class SoundyStringMenu extends StringSelectMenu {
	/**
	 * The function to run when the string menu is clicked.
	 */
	public run!: (
		interaction: StringSelectMenuInteraction,
		setPage: (n: number) => void,
	) => Awaitable<unknown>;

	/**
	 * The data of the string menu.
	 */
	declare data: StringSelectMenu["data"];

	/**
	 *
	 * The function to run when the string menu is clicked.
	 * @param run The function to run when the string menu is clicked.
	 * @returns
	 */
	public setRun(run: SoundyStringMenu["run"]): this {
		this.run = run;
		return this;
	}
}

type SoundyComponents = SoundyButton | SoundyStringMenu;
type SoundyComponentInteraction = ButtonInteraction &
	StringSelectMenuInteraction;

/**
 * Main Soundy paginator class.
 */
export class EmbedPaginator {
	/**
	 * The pages of the paginator.
	 */
	protected pages = 0;

	/**
	 * The embeds of the paginator.
	 */
	private embeds: Embed[] = [];
	/**
	 * The message reference of the paginator.
	 */
	private message: Message | WebhookMessage | null = null;
	/**
	 * The context reference of the paginator.
	 */
	private ctx: AnyContext;
	/**
	 * The rows of the paginator.
	 */
	private rows: ActionRow<SoundyComponents>[] = [];
	/**
	 * The disabled type of the paginator.
	 */
	private disabled = false;

	/**
	 *
	 * Create a new EmbedPagination instance.
	 * @param options The options.
	 */
	constructor(ctx: AnyContext) {
		this.ctx = ctx;
	}

	/**
	 *
	 * Get the current row of the paginator.
	 * @returns
	 */
	private getRows(): ActionRow<Button | SoundyComponents>[] {
		const rows: ActionRow<Button | SoundyComponents>[] = [
			new ActionRow<Button>().addComponents(
				new Button()
					.setEmoji(this.ctx.client.config.emoji.previous)
					.setStyle(ButtonStyle.Secondary)
					.setCustomId("pagination-pagePrev")
					.setDisabled(this.disabled || this.pages === 0),
				new Button()
					.setLabel(`${this.currentPage}/${this.maxPages}`)
					.setStyle(ButtonStyle.Primary)
					.setDisabled(true)
					.setCustomId("pagination-pagePos"),
				new Button()
					.setEmoji(this.ctx.client.config.emoji.skip)
					.setStyle(ButtonStyle.Secondary)
					.setCustomId("pagination-pageNext")
					.setDisabled(this.disabled || this.pages === this.embeds.length - 1),
			),
		];

		if (this.rows.length)
			rows.unshift(...(this.rows as ActionRow<Button | SoundyComponents>[]));

		return rows;
	}

	/**
	 *
	 * Create the component collector.
	 * @param flags The message flags.
	 * @returns
	 */
	private async createCollector(flags?: MessageFlags): Promise<this> {
		const embed = this.embeds[this.pages];
		if (!embed) throw new Error("Embed for current page is undefined.");
		this.message = await this.ctx.editOrReply(
			{
				content: "",
				embeds: [embed],
				components: this.getRows(),
				flags,
			},
			true,
		);

		const { event } = await this.ctx.getLocale();

		const collector = this.message.createComponentCollector({
			idle: 60e3,
			filter: (interaction) => interaction.user.id === this.ctx.author.id,
			onPass: async (interaction) => {
				await interaction.write({
					flags: MessageFlags.Ephemeral,
					embeds: [
						{
							color: EmbedColors.Red,
							description: `${interaction.client.config.emoji.no} ${event.paginator.only_author}`,
						},
					],
				});
			},
			onStop: async (reason) => {
				if (reason === "idle") {
					function isAPIActionRowComponent(
						row: unknown,
					): row is APIActionRowComponent<APIMessageActionRowComponent> {
						return (
							typeof row === "object" &&
							row !== null &&
							"type" in row &&
							(row as { type: number }).type === 1 &&
							Array.isArray((row as { components?: unknown }).components)
						);
					}

					let rawRows: unknown[] = [];
					if (
						this.message?.components &&
						Array.isArray(this.message.components)
					) {
						rawRows = this.message.components.map((component) =>
							typeof (component as { toJSON?: () => unknown }).toJSON ===
							"function"
								? (component as { toJSON: () => unknown }).toJSON()
								: component,
						);
					}
					const components: APIActionRowComponent<APIMessageActionRowComponent>[] =
						rawRows.filter(isAPIActionRowComponent).map((row) => ({
							...row,
							components: row.components.map((child) => ({
								...child,
								disabled: true,
							})),
						}));
					if (this.message?.id && this.message?.channelId) {
						await this.ctx.client.messages
							.edit(this.message.id, this.message.channelId, { components })
							.catch(() => null);
					}
				}
			},
		});

		collector.run(
			["pagination-pagePrev", "pagination-pageNext"],
			async (interaction) => {
				if (!interaction.isButton()) return;

				if (interaction.customId === "pagination-pagePrev" && this.pages > 0)
					--this.pages;
				if (
					interaction.customId === "pagination-pageNext" &&
					this.pages < this.embeds.length - 1
				)
					++this.pages;

				await interaction.deferUpdate();
				const embed = this.embeds[this.pages];
				if (!embed) throw new Error("Embed for current page is undefined.");
				await this.ctx
					.editOrReply({ embeds: [embed], components: this.getRows() })
					.catch(() => null);
			},
		);

		if (this.rows.length) {
			collector.run<SoundyComponentInteraction>(/./, (interaction) => {
				for (const row of this.rows) {
					for (const component of row.components) {
						if (
							(component.data as { custom_id?: string }).custom_id ===
							interaction.customId
						) {
							if (!(component as SoundyComponents).run)
								throw new InvalidComponentRun(
									`The component: "${interaction.customId}" doesn't have a run function.`,
								);

							return (component as SoundyComponents).run(
								interaction,
								async (n: number) => {
									if (n < 0 || n >= this.embeds.length) return;
									this.pages = n;
									await interaction.deferUpdate();
									const embed = this.embeds[this.pages];
									if (!embed)
										throw new Error("Embed for current page is undefined.");
									await this.ctx
										.editOrReply({
											embeds: [embed],
											components: this.getRows(),
										})
										.catch(() => null);
								},
							);
						}
					}
				}
				return undefined;
			});
		}

		return this;
	}

	/**
	 * Get the current page of the paginator.
	 */
	get currentPage(): number {
		return this.pages + 1;
	}

	/**
	 * Get the max pages of the paginator.
	 */
	get maxPages(): number {
		return this.embeds.length;
	}

	/**
	 *
	 * Add a new embed to display.
	 * @param embed The embed.
	 */
	public addEmbed(embed: Embed): this {
		this.embeds.push(embed);
		return this;
	}

	/**
	 *
	 * Set a new array of embeds to display.
	 * @param embeds The embeds.
	 */
	public setEmbeds(embeds: Embed[]): this {
		this.embeds = embeds;
		return this;
	}

	/**
	 *
	 * Set a new array of rows to display.
	 * @param rows The rows.
	 * @returns
	 */
	public setRows(rows: ActionRow<SoundyButton | SoundyStringMenu>[]): this {
		this.rows = rows;
		return this;
	}

	/**
	 *
	 * Set if the pagination buttons are disabled. (Exept the custom rows)
	 * @param disabled The disabled.
	 * @default false
	 * @returns
	 */
	public setDisabled(disabled: boolean): this {
		this.disabled = disabled;
		return this;
	}

	/**
	 *
	 * Set a page to desplay the embed.
	 * @param page The page.
	 */
	public setPage(page: number): this {
		if (!this.embeds.length)
			throw new InvalidEmbedsLength(
				"I can't send the pagination without embeds.",
			);
		if (!this.message)
			throw new InvalidMessage(
				"I can't set the page to an unresponded pagination.",
			);

		if (page > this.embeds.length || page < 1)
			throw new InvalidPageNumber(
				`The page: "${page}" is invalid. There are: "${this.embeds.length}" pages.`,
			);

		this.pages = page - 1;
		const embed = this.embeds[this.pages];
		if (!embed) throw new Error("Embed for current page is undefined.");
		this.ctx.editOrReply({
			content: "",
			embeds: [embed],
			components: this.getRows(),
		});

		return this;
	}

	/**
	 *
	 * Send the embed pagination.
	 * @param ephemeral If the message should be ephemeral.
	 * @returns
	 */
	public reply(ephemeral = false): Promise<this> {
		if (!this.embeds.length)
			throw new InvalidEmbedsLength(
				"I can't send the pagination without embeds.",
			);
		return this.createCollector(ephemeral ? MessageFlags.Ephemeral : undefined);
	}

	/**
	 *
	 * Edit a current embed paginator.
	 * @param body The body.
	 * @returns
	 */
	public async edit(
		body: InteractionCreateBodyRequest | InteractionMessageUpdateBodyRequest,
	): Promise<this> {
		if (!this.message)
			throw new InvalidMessage(
				"I can't set the page to an unresponded pagination.",
			);

		await this.ctx.editOrReply(body);

		return this;
	}

	/**
	 *
	 * Update the current embed paginator.
	 * @returns
	 */
	public async update(): Promise<this> {
		if (!this.message)
			throw new InvalidMessage(
				"I can't set the page to an unresponded pagination.",
			);

		const embed = this.embeds[this.pages];
		if (!embed) throw new Error("Embed for current page is undefined.");
		await this.edit({
			content: "",
			embeds: [embed],
			components: this.getRows(),
		});

		return this;
	}
}
