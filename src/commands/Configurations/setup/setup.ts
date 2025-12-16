import { AutoLoad, Command, Declare, LocalesT } from "seyfert";
import { SoundyCategory } from "#soundy/types";
import { SoundyOptions } from "#soundy/utils";

@Declare({
	name: "setup",
	description: "Setup or remove a music request channels",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
	defaultMemberPermissions: ["ManageGuild"],
})
@AutoLoad()
@LocalesT("cmd.setup.name", "cmd.setup.description")
@SoundyOptions({ cooldown: 10, category: SoundyCategory.Configurations })
export default class SetupCommand extends Command {}
