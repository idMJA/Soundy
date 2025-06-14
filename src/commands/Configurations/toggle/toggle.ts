import { AutoLoad, Command, Declare, LocalesT } from "seyfert";
import { SoundyOptions } from "#soundy/utils";
import { SoundyCategory } from "#soundy/types";

@Declare({
	name: "toggle",
	description: "Toggle a feature",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
	defaultMemberPermissions: ["ManageGuild"],
})
@AutoLoad()
@LocalesT("cmd.toggle.name", "cmd.toggle.description")
@SoundyOptions({ cooldown: 10, category: SoundyCategory.Configurations })
export default class ToggleCommand extends Command {}
