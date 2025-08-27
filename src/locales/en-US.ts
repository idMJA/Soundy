export default {
	metadata: {
		name: "English",
		code: "en-US",
		translators: ["iaMJ"],
	},
	// Commands
	cmd: {
		// Requested By
		requested_by: ({ user }: { user: string }) => `Requested by ${user}`,
		// Powered By
		powered_by: ({ provider }: { provider: string }) =>
			`Powered by ${provider}`,
		// Error
		error:
			"An error occurred while processing the command. Please try again later.",
		// Default Commands
		default: {
			name: "default",
			description: "Configure your default settings",
			sub: {
				name: "volume",
				description: "Change the player default volume.",
				options: {
					volume: {
						name: "volume",
						description: "Enter the volume",
					},
				},
				run: {
					description: ({ volume }: { volume: number }) =>
						`Default volume has been set to ${volume}%`,
				},
			},
		},
		// Setup Commands
		setup: {
			name: "setup",
			description: "Setup or remove a music request channels",
			sub: {
				create: {
					name: "create",
					description: "Create a music request channels",
					run: {
						exists: "A music request channel already exists",
						failed: "Failed to create music setup messages",
						topic:
							"Soundy Music Player - Type a song name or URL to play music.",
						success: ({ channel }: { channel: string }) =>
							`Successfully created music setup in ${channel}`,
					},
				},
				delete: {
					name: "delete",
					description: "Delete the music request channel",
					run: {
						exists: "No music setup channel exists",
						success: "Successfully deleted the music setup channel",
						failed: "Failed to delete the music setup channel",
					},
				},
			},
		},
		// Toggle Commands
		toggle: {
			name: "toggle",
			description: "Toggle a features",
			sub: {
				_247: {
					name: "247",
					description: "Toggle 24/7 mode on this servers",
					run: {
						enabled: "24/7 mode has been enabled for this server",
						disabled: "24/7 mode has been disabled for this server",
					},
				},
				voicestatus: {
					name: "voicestatus",
					description: "Toggle voice status on this servers",
					options: {
						enabled: {
							name: "enabled",
							description: "Enable or disable voice status for this server",
						},
					},
					run: {
						enabled: "Voice status has been enabled for this server",
						disabled: "Voice status has been disabled for this server",
					},
				},
			},
		},
		// Prefix Commands
		prefix: {
			name: "prefix",
			description: "Set the prefix for this server",
			options: {
				prefix: {
					name: "prefix",
					description: "Enter the new prefix",
				},
			},
			run: {
				success: ({ prefix }: { prefix: string }) =>
					`Successfully set prefix to: ${prefix}`,
				reset: "Prefix has been reset to default",
			},
		},
		// Filter Commands
		filter: {
			name: "filter",
			description: "Apply audio filters to the music",
			sub: {
				run: {
					success: ({ filter }: { filter: string }) =>
						`Applied the ${filter} filter`,
					error: "An error occurred while applying the filter",
				},
				_8d: {
					name: "8d",
					description: "Apply 8D effect to the music",
					filter: "8D",
				},
				bassboost: {
					name: "bassboost",
					description: "Enhance bass frequencies in the music",
					filter: "Bassboost",
				},
				karaoke: {
					name: "karaoke",
					description: "Apply karaoke effect to the music",
					filter: "Karaoke",
				},
				nightcore: {
					name: "nightcore",
					description: "Apply nightcore effect to the music",
					filter: "Nightcore",
				},
				pop: {
					name: "pop",
					description: "Apply pop effect to the music",
					filter: "Pop",
				},
				reset: {
					name: "reset",
					description: "Reset the audio filters",
					run: {
						success: "All filters have been reset",
						error: "An error occurred while resetting filters",
					},
				},
				soft: {
					name: "soft",
					description: "Apply soft effect to the music",
					filter: "Soft",
				},
				treblebass: {
					name: "treblebass",
					description: "Enhance treble and bass frequencies in the music",
					filter: "Treblebass",
				},
				tremolo: {
					name: "tremolo",
					description: "Apply tremolo effect to the music",
					filter: "Tremolo",
				},
				vaporwave: {
					name: "vaporwave",
					description: "Apply vaporwave effect to the music",
					filter: "Vaporwave",
				},
				vibrato: {
					name: "vibrato",
					description: "Apply vibrato effect to the music",
					filter: "Vibrato",
				},
			},
		},
		// About Commands
		about: {
			name: "about",
			description: "Show information about Soundy",
			run: {
				title: "About Soundy",
				footer: ({
					guildCount,
					userCount,
				}: {
					guildCount: number;
					userCount: number;
				}) => `Serving ${guildCount} servers with ${userCount} users`,
				about_me: {
					button: "About",
					title: "About Me",
					1: "I'm a feature-rich music bot designed to deliver high-quality music playback experience on Discord.",
					2: "Key Features",
					3: "- High quality music playback",
					4: "- Support for multiple music sources",
					5: "- Advanced queue management",
					6: "- DJ role system",
					7: "- Custom playlists",
					8: "- And much more!",
					9: "Links",
					10: "Invite Me",
					11: "Support Server",
					12: "Vote for me",
					13: "Credits",
					14: ({ author }: { author: string }) => `- Contributed by: ${author}`,
					15: ({ developer }: { developer: string }) =>
						`- Developed by: ${developer}`,
					16: ({ country }: { country: string }) => `- Country: ${country}`,
				},
				contributors: {
					button: "Contributors",
					title: "Soundy Contributors",
					1: "Special Thanks",
					2: ({ author }: { author: string }) => `${author}: Creator of Soundy`,
					3: ({ user }: { user: string }) =>
						`${user}: Bug Fixer, and more contributions`,
					4: ({ user }: { user: string }) => `${user}: Part of the source code`,
					5: "Links",
					6: "Tronix Development Community",
					7: "All contributors and supporters",
					8: "License",
					9: ({ license }: { license: string }) =>
						`This project is licensed under the ${license}`,
					10: "View License",
				},
				packages: {
					button: "Packages",
					title: "Soundy Packages & Runtime",
					1: "Core Libraries",
				},
			},
		},
		// Top Commands
		top: {
			name: "top",
			description: "View top statistics for tracks and users",
			sub: {
				guilds: {
					name: "guilds",
					description:
						"Shows the most active music servers in the last 2 weeks",
					run: {
						title: "Top Music Servers",
						description: "Most active music servers in the last 2 weeks",
						fields: ({
							totalPlays,
							uniqueTracks,
						}: {
							totalPlays: number;
							uniqueTracks: number;
						}) => `Played ${totalPlays} tracks (${uniqueTracks} unique)`,
						footer: ({ length }: { length: number }) =>
							`Showing top ${length} servers`,
						unknown: "Unknown Server",
						no_data: "No music activity recorded in the last 2 weeks!",
					},
				},
				tracks: {
					name: "tracks",
					description: "Shows the most played tracks in the last 2 weeks",
					run: {
						title: "Top Tracks",
						description: "Most played tracks in the last 2 weeks",
						fields: ({
							author,
							playCount,
							trackId,
						}: {
							author: string;
							playCount: number;
							trackId: string;
						}) =>
							`By ${author} • Played ${playCount} times\n[Link](${trackId})`,
						footer: ({ length }: { length: number }) =>
							`Showing top ${length} tracks`,
						no_data: "No tracks have been played in the last 2 weeks!",
					},
				},
				users: {
					name: "users",
					description: "Shows the most active users in the last 2 weeks",
					run: {
						title: "Top Music Users",
						description: "Top music listeners in the last 2 weeks",
						fields: ({ playCount }: { playCount: number }) =>
							`Played ${playCount} tracks`,
						footer: ({ length }: { length: number }) =>
							`Showing top ${length} users`,
						unknown: "Unknown User",
						no_data: "No users have played music in the last 2 weeks!",
					},
				},
			},
		},
		// Help Commands
		help: {
			name: "help",
			description: "Get information on our bot commands and features",
			options: {
				command: {
					name: "command",
					description: "The command to get help for",
				},
			},
			run: {
				title: "Soundy Help Menu",
				description: {
					1: ({ user, bot }: { user: string; bot: string }) =>
						`**Haii! ${user} I'm ${bot} your musical companion!**`,
					2: ({ bot }: { bot: string }) =>
						`**${bot} is a music bot designed to provide an amazing music listening experience on Discord. With its comprehensive and easy-to-use features, ${bot} is the perfect choice for your Discord server.**`,
					3: "**Select A Category From The Menu Below.**",
					4: ({
						invite,
						support,
						vote,
					}: {
						invite: string;
						support: string;
						vote: string;
					}) =>
						`**[Invite Me](${invite}) • [Support Server](${support}) • [Vote](${vote})**`,
				},
				footer: ({ bot }: { bot: string }) => `Thanks for choosing ${bot}!`,
				select: "Select a category",
				categoryTitle: ({ category }: { category: string }) =>
					`${category} Commands`,
				notFound: "Commands not found!",
				unknown: "Unknown",
			},
		},
		// Nodes Commands
		nodes: {
			name: "nodes",
			description: "Check music nodes status",
			run: {
				title: "Node Status Overview",
				description: "Select a node to view detailed information",
				fields: ({ players, uptime }: { players: number; uptime: string }) =>
					`\`\`\`js\nPlayers: ${players}\nUptime: ${uptime}\`\`\``,
				footer: "Select a node to view detailed information",
				status: ({ status }: { status: string }) => `Status: ${status}`,
				connected: "Connected",
				disconnected: "Disconnected",
				no_nodes: "No nodes found",
			},
		},
		// Ping Commands
		ping: {
			name: "ping",
			description: "Check the bot's latency and API response time",
			run: {
				title: "Soundy Latency Information",
				description: {
					1: "Websocket Latency",
					2: "Client Latency",
					3: "Shard Latency",
				},
				check_title: "Checking Latency...",
				check_description: "Please wait while I check the connection...",
			},
		},
		// Autoplay Commands
		autoplay: {
			name: "autoplay",
			description: "Toggle the autoplay feature",
			run: {
				title: "Autoplay",
				enabled: "Autoplay has been enabled",
				disabled: "Autoplay has been disabled",
			},
		},
		// Clearqueue Commands
		clearqueue: {
			name: "clearqueue",
			description: "Clear the current music queue",
		},
		// Forward Commands
		forward: {
			name: "forward",
			description: "Forward the current track by 10 seconds",
			run: {
				title: "Forward",
				description: ({
					forwardPosition,
					currentTrack,
				}: {
					forwardPosition: number;
					currentTrack: string;
				}) => `Forwarded to ${forwardPosition} / ${currentTrack}`,
				no_song: "No song is currently playing",
				stream: "Cannot forward on a live stream",
			},
		},
		// Grab Commands
		grab: {
			name: "grab",
			description: "Grab the currently playing song and send it to your DMs",
			run: {
				title: "Grab",
				description: {
					1: "Title",
					2: "Duration",
					3: "Requested by",
				},
				dm: "Check your DMs! The song details have been sent.",
				dm_failed:
					"Failed to send song details to your DMs. Do you have DMs enabled?",
				no_song: "No song is currently playing",
			},
		},
		// Join Commands
		join: {
			name: "join",
			description: "Make the bot join your voice channel",
			run: {
				title: "Join",
				description: ({ voiceChannel }: { voiceChannel: string }) =>
					`Woohoo! I've crashed the party in ${voiceChannel}!\nTime to turn up the volume and make some musical magic happen!`,
			},
		},
		// Leave Commands
		leave: {
			name: "leave",
			description: "Make the bot leave the voice channel",
			run: {
				title: "Left Voice Channel",
				description:
					"The party's wrapped up! I've cleared the queue and left the channel.\nReady when you are for another musical adventure!",
			},
		},
		// Loop Commands
		loop: {
			name: "loop",
			description: "Toggle the loop mode",
		},
		// Lyrics Commands
		lyrics: {
			name: "lyrics",
			description: "Search for lyrics of a song",
			options: {
				query: {
					name: "query",
					description:
						"Song to search for or music URL (leave empty for current song)",
				},
			},
			run: {
				no_tracks: "No tracks found",
				invalid_url: "Invalid URL provided",
				provide_song:
					"Please provide a song name or URL, or play a song first.",
				error: "An error occurred while fetching the lyrics.",
			},
		},
		// Move Commands
		move: {
			name: "move",
			description: "Move the player to a different voice channel",
			options: {
				voice: {
					name: "voice",
					description: "Select the voice channel.",
				},
				text: {
					name: "text",
					description: "Select the text channel.",
				},
			},
			run: {
				description: ({
					voiceChannel,
					textChannel,
				}: {
					voiceChannel: string;
					textChannel: string;
				}) =>
					`Moved player to voice channel ${voiceChannel}${textChannel ? ` and text channel ${textChannel}` : ""}.`,
			},
		},
		// Nowplaying Commands
		nowplaying: {
			name: "nowplaying",
			description: "Get the current playing song",
			run: {
				now_playing: "Now Playing",
				artist: "Artist",
				duration: "Duration",
				requested_by: "Requested by",
			},
		},
		// Pause Commands
		pause: {
			name: "pause",
			description: "Pause the current track",
			run: {
				paused: "The track is already paused.",
			},
		},
		// Play Commands
		play: {
			name: "play",
			description: "Play a song or playlist",
			options: {
				query: {
					name: "query",
					description: "Enter the track name or url.",
				},
			},
		},
		// Previous Commands
		previous: {
			name: "previous",
			description: "Play the previous track in the queue",
		},
		// Queue Commands
		queue: {
			name: "queue",
			description: "Shows the current music queue",
		},
		// Replay Commands
		replay: {
			name: "replay",
			description: "Replay the current track from the beginning",
			run: {
				title: "Replaying Track",
			},
		},
		resume: {
			name: "resume",
			description: "Resume the paused track",
			run: {
				resumed: "The track is already playing.",
			},
		},
		rewind: {
			name: "rewind",
			description: "Rewind the current track by 10 seconds",
			run: {
				title: "Rewind",
				description: ({
					rewindPosition,
					currentTrack,
				}: {
					rewindPosition: string;
					currentTrack: string;
				}) => `Rewinded to ${rewindPosition} / ${currentTrack}`,
				no_song: "No song is currently playing",
				no_stream: "Cannot rewind on a live stream",
			},
		},
		// Seek Commands
		seek: {
			name: "seek",
			description: "Seek the current track",
			options: {
				time: {
					name: "time",
					description: "Enter the time. (Ex: 2min)",
				},
			},
			run: {
				title: "Seek",
				description: ({ time }: { time: string }) => `Seeked to ${time}`,
				invalid_time: ({ time }: { time: string }) => `Invalid time: ${time}`,
				no_track: "No track is currently playing",
				no_seekable: "This track is not seekable.",
				time_exceeds: ({ time }: { time: string }) =>
					`Time exceeds track duration: ${time}`,
			},
		},
		// Shuffle Commands
		shuffle: {
			name: "shuffle",
			description: "Shuffle the queue",
		},
		// Skip Commands
		skip: {
			name: "skip",
			description: "Skip the current track",
		},
		// Stop Commands
		stop: {
			name: "stop",
			description: "Stop the player",
		},
		// Volume Commands
		volume: {
			name: "volume",
			description: "Set the player volume",
			options: {
				volume: {
					name: "volume",
					description: "Enter the volume",
				},
			},
			run: {
				paused: "Paused",
				paused_description:
					"Taking a quick breather! The music's on pause for now",
			},
		},
		// Playlist Commands
		playlist: {
			name: "playlist",
			description: "Manage your music playlists",
			run: {
				footer: ({ page, total }: { page: string; total: number }) =>
					`Page ${page} • Total playlists: ${total}`,
				not_found: "Playlist not found",
				no_tracks: "No tracks found",
			},
			sub: {
				add: {
					name: "add",
					description: "Add a track to a playlist",
					options: {
						playlist: {
							name: "playlist",
							description: "The name of the playlist",
						},
						query: {
							name: "query",
							description: "Track URL, playlist URL, or search query",
						},
					},
					run: {
						added: ({ track, playlist }: { track: string; playlist: string }) =>
							`Added **${track} tracks** to playlist ${playlist}`,
						// - Added **1 tracks** to playlist **Tonikaku Kawaii**
						// - Added track **Unmei?** to playlist **Tonikaku Kawaii**
						error: "An error occurred while adding tracks to the playlist",
					},
				},
				create: {
					name: "create",
					description: "Create a new playlist",
					options: {
						name: {
							name: "name",
							description: "The name of the playlist",
						},
					},
					run: {
						success: ({ playlist }: { playlist: string }) =>
							`Successfully created playlist \`${playlist}\``,
						already_exists: "A playlist with this name already exists",
						error: "An error occurred while creating the playlist",
					},
				},
				delete: {
					name: "delete",
					description: "Delete a playlist",
					options: {
						name: {
							name: "name",
							description: "The name of the playlist",
						},
					},
					run: {
						deleted: ({ playlist }: { playlist: string }) =>
							`Deleted playlist \`${playlist}\``,
						error: "An error occurred while deleting the playlist.",
					},
				},
				list: {
					name: "list",
					description: "List all your playlists",
					run: {
						title: ({ author }: { author: string }) => `${author}'s Playlists`,
						list: ({
							playlist,
							tracks,
						}: {
							playlist: string;
							tracks: number;
						}) => `${playlist} - ${tracks} tracks`,
						no_playlists: "You don't have any playlists",
						error: "An error occurred while fetching your playlists",
					},
				},
				load: {
					name: "load",
					description: "Load and play a playlist",
					options: {
						name: {
							name: "name",
							description: "The name of the playlist",
						},
					},
					run: {
						loaded: ({
							tracks,
							playlist,
						}: {
							tracks: number;
							playlist: string;
						}) => `Loaded **${tracks} tracks** from playlist ${playlist}`,
						error: "An error occurred while loading the playlist",
					},
				},
				remove: {
					name: "remove",
					description: "Remove a track from a playlist",
					options: {
						name: {
							name: "name",
							description: "The name of the playlist",
						},
						track: {
							name: "track",
							description: "The track number to remove",
						},
					},
					run: {
						removed: ({ name }: { name: string }) =>
							`Removed track from playlist ${name}`,
						invalid: "Invalid track number",
						error:
							"An error occurred while removing the track from the playlist",
					},
				},
				view: {
					name: "view",
					description: "View tracks in a playlist",
					options: {
						name: {
							name: "name",
							description: "The name of the playlist",
						},
					},
					run: {
						title: ({ name }: { name: string }) => `Playlist: ${name}`,
						empty: "This playlist is empty",
						failed: "Failed to load track details",
						error: "An error occurred while viewing the playlist",
					},
				},
			},
		},
		// Report Commands
		report: {
			name: "report",
			description: "Report a bug, users or suggestions",
			sub: {
				bug: {
					name: "bug",
					description: "Report a bug you found in the bots",
					run: {
						label: "Report a Bugs",
						init_title: "Bug Reports",
						init_description:
							"Click the button below to report a bug you found in the bot",
						description: "Describe the bug you encountered",
						description_placeholder:
							"What happened? What did you expect to happen?",
						steps: "Steps to reproduce the bug",
						steps_placeholder:
							"1. First step\n2. Second step\n3. Third step...",
						success: "Bug Report Submitted",
						error: "Error Submitting Bug Report",
						success_description: ({ reportId }: { reportId: string }) =>
							`Your bug report has been successfully submitted.\n\n**Report ID:** ${reportId}`,
						error_description:
							"An error occurred while submitting your bug report. Please try again later",
						invalid_user:
							"Only the user who initiated this command can report a bug",
					},
				},
				suggestion: {
					name: "suggestion",
					description: "Give a suggestion you want to see in the bots",
					run: {
						label: "Give a Suggestions",
						init_title: "Suggestions",
						init_description:
							"Click the button below to give a suggestion you want to see in the bots",
						description: "Describe the suggestion you have",
						description_placeholder:
							"What would you like to see added or improved?",
						steps: "Steps to reproduce the bug",
						steps_placeholder:
							"1. First step\n2. Second step\n3. Third step...",
						success: "Suggestion Submitted",
						error: "Error Submitting Suggestion",
						success_description: ({ reportId }: { reportId: string }) =>
							`Your suggestion has been successfully submitted.\n\n**Report ID:** ${reportId}`,
						error_description:
							"An error occurred while submitting your suggestion. Please try again later",
						invalid_user:
							"Only the user who initiated this command can give a suggestions",
					},
				},
			},
		},
	},
	// Events
	event: {
		setup: {
			title: "Soundy Music Player",
			description:
				"Join a voice channel and queue songs by name or url in this channel.",
			no_voice: "You must be in a voice channel to use this!",
			no_connect:
				"I need `CONNECT` and `SPEAK` permissions in your voice channel!",
			failed: "Failed to join your voice channel!",
			no_results: ({ query }: { query: string }) =>
				`No results found for ${query}`,
			error: "An error occurred while processing your request!",
		},
		// Music Events
		music: {
			title: "Title",
			artist: "Artist",
			duration: "Duration",
			requested_by: "Requested by",
			now_playing: "Now Playing",
			node: "Node",
			finish_time: "Finish Time",
			tracks: "Tracks",
			added: "Added to Queue",
			added_playlist: "Added Playlist to Queue",
			added_songs: ({ songs }: { songs: string }) => `${songs} songs`, // 79 songs
			no_results: "No results found for the given query.",
			pause: {
				title: "Track Paused",
				description:
					"The rhythm has been gently suspended!\nYour musical journey is on a magical intermission.",
			},
			resume: {
				title: "Track Resumed",
				description: "The music has been resumed!\nLet's keep the party going!",
			},
		},
		cooldown: ({ seconds }: { seconds: number }) =>
			`Please wait ${seconds} seconds before using this command again.`,
		// Manager
		manager: {
			no_nodes: "No nodes are currently available. Please try again later.",
			no_player: "There is no active music player in this server.",
			no_tracks: "There are no tracks in the queue.",
			not_enough: "Not enough tracks in queue to perform this action.",
		},
		// Premium
		premium: {
			limit_reached: {
				title: "You've used all your free commands!",
				description: ({ time }: { time: number }) =>
					`Please vote for Soundy on top.gg to get ${time} hours of unlimited access.`,
			},
			vote_now: "Vote Now",
		},
		// Verifications
		verifications: {
			only_developer: "This command is only available to the developers.",
			only_guild_owner: "This command is only available to the guild owner.",
		},
		// Voice
		voice: {
			no_same: ({ channel }: { channel: string }) =>
				`You must be in the same voice channel as me on ${channel}!`,
			no_vc: "You must be in a voice channel to use this command!",
			no_perms: ({ channel }: { channel: string }) =>
				`I don't have the required permissions in ${channel}!`,
			missing_perms: "Missing Permissions",
			failed: "Failed to join your voice channel!",
		},
		// Listeners
		listeners: {
			no_members: "No members left in the voice channel",
			disconnect: ({ time }: { time: string }) =>
				`Channel is empty! Player will be disconnected in ${time} seconds.`,
			kicked: "I've been kicked from the voice channel!",
			resume: "Members joined! Resuming the players",
			paused_247: "Paused music because I'm alone (24/7 mode enabled)",
		},
		// Mention
		mention: {
			title: "Welcome to Soundy!",
			description: {
				1: ({ prefix }: { prefix: string }) =>
					`Use \`${prefix}help\` or \`/help\` to discover all my amazing commands`,
				2: "Need help? Join our Support Server for assistance",
				3: ({ prefix }: { prefix: string }) =>
					`Want to get started? Just type \`${prefix}play\` or \`/play\` to begin your musical journey!`,
				4: "Features:",
				5: "High quality music streaming",
				6: "Rich playlist management",
				7: "Support for multiple platforms",
			},
			footer: "Play a high quality music in your Discord server for free.",
			button: {
				add: "Add to Server",
				support: "Support Server",
				vote: "Vote",
			},
		},
		// Overrides
		overrides: {
			error: "An error occurred while executing this commands",
			missing_perms: "Missing Permissions",
			missing_user_perms:
				"You don't have the required permissions to use this commands",
			missing_bot_perms:
				"I don't have the required permissions to use this commands",
			invalid_command: {
				1: "Invalid command usage. Here's how to use it:",
				2: "Options:",
			},
		},
		// Paginator
		paginator: {
			only_author: "Sorry, only the command author can use this menu.",
		},
	},
	// Components
	component: {
		// Clear Queue
		clear: {
			description: "Queue has been cleared",
		},
		// Loop
		loop: {
			title: "Loop Mode Updated",
			description: ({ mode }: { mode: string }) =>
				`Loop mode updated to ${mode}`,
			select_title: "Loop Mode Selection",
			select_description: "Select a loop mode to change to:",
			off: "Off",
			track: "Track",
			queue: "Queue",
			loop_off: "Loop is currently disabled",
			loop_track: "Currently looping the current track",
			loop_queue: "Currently looping the entire queue",
		},
		// Previous
		previous: {
			title: "Playing previous track",
			description:
				"Rewinding the musical journey back to the beginning!\nTime to groove to this awesome tune once more!",
			no_previous: "No previous track",
			no_previous_description:
				"Oops! There's no previous track to play!\nLet's keep the party going with the current one!",
		},
		// Queue
		queue: {
			name: "Queue",
			now_playing: "Now Playing",
			total: ({ total }: { total: number }) => `Total tracks: ${total}`,
			track: ({ track, author }: { track: string; author: string }) =>
				`${track} by ${author}`,
			requested_by: ({ user }: { user: string }) => `Requested by ${user}`,
			up_next: "Up Next",
			unknown_artist: "Unknown Artist",
		},
		// Shuffle
		shuffle: {
			description:
				"The queue has been shuffled!\nLet's keep the party going with a new mix!",
		},
		skip: {
			title: "Skipped",
			description: "Skipped to next track in queue",
			autoplay: "Skipped to an awesome recommended track",
			end: "That's a wrap! We've reached the end of our musical journey for now.\nTime for a fresh start with some new tunes!",
		},
		stop: {
			title: "Stopped",
			description:
				"The party's wrapped up! I've cleared the queue and packed up the speakers.\nReady when you are for another musical adventure!",
		},
		// Volume
		volume: {
			title: "Volume Set",
			description: ({ volume }: { volume: string }) =>
				`Volume has been set to ${volume}`,
		},
		// Lyrics
		lyrics: {
			title: ({ song }: { song: string }) => `Lyrics for ${song}`,
			description: "Lyrics for the current song or a specific song",
			no_lyrics: "No lyrics found for this song.",
		},

		// Node Select
		nodeSelect: {
			title: ({ node }: { node: string }) => `Node Information - ${node}`,
			status: ({ status }: { status: string }) => `Status: ${status}`,
			connected: "Connected",
			disconnected: "Disconnected",
			description: "Select a node to view detailed information",
			players: ({ players }: { players: number }) => `Players: ${players}`,
			playing_players: ({ playingPlayers }: { playingPlayers: number }) =>
				`Playing Players: ${playingPlayers}`,
			uptime: ({ uptime }: { uptime: string }) => `Uptime: ${uptime}`,
			cpu: "CPU",
			cores: ({ cores }: { cores: number }) => `Cores: ${cores}`,
			system_load: ({ systemLoad }: { systemLoad: string }) =>
				`System Load: ${systemLoad}%`,
			lavalink_load: ({ lavalinkLoad }: { lavalinkLoad: string }) =>
				`Lavalink Load: ${lavalinkLoad}%`,
			memory: "Memory",
			used: ({ used }: { used: string }) => `Used: ${used}`,
			reservable: ({ reservable }: { reservable: string }) =>
				`Reservable: ${reservable}`,
			no_node: "This node is no longer available.",
		},
	},
	// Middleware
	middlewares: {
		cooldown: {
			description: ({ seconds }: { seconds: number }) =>
				`Please wait ${seconds} seconds before using this command again.`,
		},
	},
	// Autocomplete
	autocomplete: {
		music: {
			no_nodes: "No nodes available",
			no_voice: "No voice channel",
			no_tracks: "No tracks found",
		},
	},
};
