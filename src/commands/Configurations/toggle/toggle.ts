import { AutoLoad, Command, Declare, LocalesT } from "seyfert";
import { SoundyCategory } from "#soundy/types";
import { SoundyOptions } from "#soundy/utils";

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
