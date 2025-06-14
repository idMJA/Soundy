import { config } from "seyfert";
import { GatewayIntentBits } from "seyfert/lib/types";
import { Environment } from "#soundy/config";

export default config.bot({
  token: Environment.Token ?? "Huh? You need a token to run this bot!",
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates
  ],
  /**
     * @type {import("seyfert").RuntimeConfig["locations"] & { lavalink: string }}
     */
  locations: {
    base: 'src',
    commands: 'commands',
    components: 'components',
    lavalink: 'lavalink',
    events: 'events',
    langs: 'locales',
  },
});
