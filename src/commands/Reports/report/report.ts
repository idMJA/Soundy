import { AutoLoad, Command, Declare } from "seyfert";
import { SoundyOptions } from "#soundy/utils";
import { SoundyCategory } from "#soundy/types";

@Declare({
	name: "report",
	description: "Report a bugs, users or suggestions",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
})
@SoundyOptions({ cooldown: 5, category: SoundyCategory.Reports })
@AutoLoad()
export default class ReportCommand extends Command {}
