import { AutoLoad, Command, Declare, LocalesT } from "seyfert";
import { SoundyCategory } from "#soundy/types";
import { SoundyOptions } from "#soundy/utils";

@Declare({
	name: "top",
	description: "View top statistics for tracks and users",
	integrationTypes: ["GuildInstall"],
})
@AutoLoad()
@LocalesT("cmd.top.name", "cmd.top.description")
@SoundyOptions({ cooldown: 5, category: SoundyCategory.Informations })
export default class TopCommand extends Command {}
