import { AutoLoad, Command, Declare, LocalesT } from "seyfert";
import { SoundyOptions } from "#soundy/utils";
import { SoundyCategory } from "#soundy/types";

@Declare({
	name: "playlist",
	description: "Manage your music playlists",
	integrationTypes: ["GuildInstall"],
	contexts: ["Guild"],
})
@LocalesT("cmd.playlist.name", "cmd.playlist.description")
@SoundyOptions({ cooldown: 5, category: SoundyCategory.Playlists })
@AutoLoad()
export default class PlaylistCommand extends Command {}
