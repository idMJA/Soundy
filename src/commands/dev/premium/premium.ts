import { AutoLoad, Command, Declare } from "seyfert";
import { SoundyOptions } from "#soundy/utils";
import { SoundyCategory } from "#soundy/types";

@Declare({
	name: "premium",
	description: "Premium user management commands",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
})
@SoundyOptions({
	cooldown: 5,
	category: SoundyCategory.Developers,
	onlyDeveloper: true,
})
@AutoLoad()
export default class PremiumCommand extends Command {}
