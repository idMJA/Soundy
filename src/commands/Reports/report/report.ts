import { AutoLoad, Command, Declare } from "seyfert";
import { SoundyCategory } from "#soundy/types";
import { SoundyOptions } from "#soundy/utils";

@Declare({
	name: "report",
	description: "Report a bugs, users or suggestions",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
})
@SoundyOptions({ cooldown: 5, category: SoundyCategory.Reports })
@AutoLoad()
export default class ReportCommand extends Command {}
