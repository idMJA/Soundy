# Soundy

Soundy is a powerful, feature-rich Discord music bot built with [Seyfert](https://github.com/tiramisulabs/Seyfert) and [lavalink-client](https://github.com/Tomato6966/lavalink-client), designed to deliver high-quality music playback for your Discord server. Enjoy seamless music streaming, advanced queue management, custom playlists, and more—all for free!

## Features
- **High-quality music playback** from various sources.
- **Queue management**: Easily add, remove, sort, and manage song queues.
- **Custom playlists**: Save and manage your personal playlists.
- **DJ & Premium system**: Control feature access and 24/7 mode.
- **Statistics & Top Charts**: View song stats and top users.
- **Compatible with slash and prefix commands**: Use commands with `/` or a custom prefix.
- **Multi-language support**: English by default, easily extendable to other languages.
- **Top.gg integration**: Unlock extra features by voting.

## Installation

1. Clone the Repository
```bash
git clone https://github.com/idMJA/Soundy.git
```

2. Go to the directory
```bash
cd Soundy
```

3. Install the dependencies
```bash
bun install
```

4. Configure the bot

`a.` Rename `.env.example` to `.env` and fill out these variables according to yours.
```bash
TOKEN= #Your Discord bot Token
DATABASE_URL= #Your Turso libSQL
DATABASE_PASSWORD= #Your Turso Password

LASTFM_API_KEY=xxx,xxx #You can add 1 or more for loadbalance (depend what you need)
```

`b.` Go to `src/config.ts`, fill out these config options value.

`c.` Go to `src/config/nodes.ts`, fill out these nodes options value.

`d.` Go to `src/config/emoji.ts`, fill out the emoji variables.

5. Run the bots
```bash
bun start
```

## Configuration

- **Prefix:** Default is `!`, can be changed per server via prefix command.
- **24/7 Mode:** Bot stays in the voice channel continuously.
- **Voice Status:** Updates the voice channel status with the currently playing song.
- **Premium:** Additional features available for premium users.

## Contributors
- [**iaMJ**](https://github.com/idMJA) — Creator of Soundy
- [**kydo**](https://github.com/88JC) — Bug Hunter
- [**Lavamusic**](https://github.com/appujet/lavamusic) — Inspiration & Ideas
- [**stelle-music**](https://github.com/Ganyu-Studios/stelle-music) — Some parts of code were adapted for this project.
- All contributors and supporters

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository and create your branch from `master`.
2. Make your changes and ensure code quality.
3. Submit a pull request with a clear description of your changes.

For questions or support, join our [Discord Server](https://discord.gg/pTbFUFdppU).

## License
This project is licensed under the [GNU Affero General Public License v3.0](LICENSE) - see the [LICENSE](LICENSE) file for details.

Copyright © 2025 Tronix Development. All rights reserved.
For commercial use, contact Tronix Development: https://discord.gg/pTbFUFdppU

---
