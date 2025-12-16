import { AutoLoad, Command, Declare } from "seyfert";
import { SoundyCategory } from "#soundy/types";
import { SoundyOptions } from "#soundy/utils";

@Declare({
	name: "database",
	description: "Database management commands",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
})
@SoundyOptions({
	cooldown: 5,
	category: SoundyCategory.Developers,
	onlyDeveloper: true,
})
@AutoLoad()
export default class DatabaseCommand extends Command {}
