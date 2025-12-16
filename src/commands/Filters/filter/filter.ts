import { AutoLoad, Command, Declare, LocalesT } from "seyfert";
import { SoundyCategory } from "#soundy/types";
import { SoundyOptions } from "#soundy/utils";

@Declare({
	name: "filter",
	description: "Apply audio filters to the music",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
})
@AutoLoad()
@LocalesT("cmd.filter.name", "cmd.filter.description")
@SoundyOptions({ cooldown: 5, category: SoundyCategory.Filters })
export default class FiltersCommand extends Command {}
