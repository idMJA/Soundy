# Soundy
A powerful music bot built with Discord.js and Magmastream to play high quality music in your Discord server for free.

## Features
- 🔌 Using [Magmastream](https://github.com/Magmastream-NPM/magmastream) Lavalink Client
- ⚡ Slash Commands 
- 🛠️ DevMode
- 🎮 Easy to use
- ⚙️ Customizable
- ⚡ Fast as flash
- 🎵 High quality music playback
- 🎶 Support for multiple music platforms (Spotify, SoundCloud, Deezer, Apple Music, YouTube)
- 📋 Queue management
- 🔊 Volume control
- 🔁 Loop and repeat modes
- 📊 Server statistics

## Requirements
- NodeJS v18+
- Java v13+ (for Lavalink server)
- Discord Bot Token & Client ID ([Guide](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot))
- Lavalink Server (see [Lavalink](https://lavalink.dev/))


## 🌟 Quick Start (Without Self-Hosting)
Want to use Soundy without hosting it yourself? Here's how:

1. [Invite Soundy](https://discord.com/oauth2/authorize?client_id=1260252174861074442&permissions=8&scope=bot%20applications.commands) to your Discord server

2. Join our [Support Server](https://discord.gg/pTbFUFdppU) for help and updates

3. Start using Soundy right away with slash commands!

That's it! No setup required. Just invite and enjoy high quality music.

## 🚀 Configuration & Installation

1. Clone the repository

2. Install dependencies
```bash
npm install
```

3. Configure the Bot

`a.` Rename `.env.example` to `.env` and fill out these variables according to yours.

```
# GENERAL DETAILS
TOKEN = # Your bot token
CLIENT_ID = # Your bot client ID
DEV = # Your Discord ID & Your developer Discord user ID (separated by comma "," if more than one)
MONGODB = # Your MongoDB URI
```

`b.` Go to `./src/config.js`, open the file and fill out these config options value.

4. Go to `./src/config/nodes.js`, open the file and fill out these nodes options value.

```js
module.exports = [
    {
        host: 'cat.mjba.live',
        identifier: 'Cat 1', 
        password: 'Nyaa',
        port: 4000,
        retryAmount: 5,
        retryDelay: 3000,
        secure: false
    },
],
```

`5.` Go to `./src/config/emoji.js`, open the file and fill out the emoji variables.

`6.` Start the bot by running the following command.

```
npm start
```

## License
This project is licensed under the [GNU Affero General Public License v3.0](LICENSE) - see the [LICENSE](LICENSE) file for details.

You are free to use and modify the code. However, you must provide attribution by linking back to the original repository and include this copyright notice.

### Credits for Soundy
- [idMJA](https://github.com/idMJA) - Creator of Soundy
- [Jecky](https://github.com/88JC) - Rewind, replay, and seek commands
- [L RMN](https://github.com/lrmn7) - Filters Configs
- [Lavamusic](https://github.com/appujet/lavamusic) - Inspiration & Ideas

## Support
Join our [Support Server](https://discord.gg/pTbFUFdppU) for help and updates
