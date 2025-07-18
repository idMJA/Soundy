import type English from "./en-US";

export default {
	metadata: {
		name: "Indonesia",
		code: "id-ID",
		translators: ["iaMJ"],
	},
	// Commands
	cmd: {
		// Requested By
		requested_by: ({ user }) => `Direquest oleh ${user}`,
		// Powered By
		powered_by: ({ provider }) => `Didukung oleh ${provider}`,
		// Error
		error:
			"Terjadi kesalahan saat memproses perintah. Silakan coba lagi nanti.",
		// Default Commands
		default: {
			name: "default",
			description: "Konfigurasi pengaturan default Kamu",
			sub: {
				name: "volume",
				description: "Ubah volume default pemain.",
				options: {
					volume: {
						name: "volume",
						description: "Masukkan volume",
					},
				},
				run: {
					description: ({ volume }) =>
						`Volume default telah diatur ke ${volume}%`,
				},
			},
		},
		// Setup Commands
		setup: {
			name: "setup",
			description: "Atur atau hapus saluran permintaan musik",
			sub: {
				create: {
					name: "create",
					description: "Buat saluran permintaan musik",
					run: {
						exists: "Saluran permintaan musik sudah ada",
						failed: "Gagal membuat pesan pengaturan musik",
						topic:
							"Soundy Music Player - Ketik nama lagu atau URL untuk memutar musik.",
						success: ({ channel }) =>
							`Berhasil membuat pengaturan musik di ${channel}`,
					},
				},
				delete: {
					name: "delete",
					description: "Hapus saluran permintaan musik",
					run: {
						exists: "Tidak ada saluran pengaturan musik",
						success: "Berhasil menghapus saluran pengaturan musik",
						failed: "Gagal menghapus saluran pengaturan musik",
					},
				},
			},
		},
		// Toggle Commands
		toggle: {
			name: "toggle",
			description: "Aktifkan/nonaktifkan fitur",
			sub: {
				_247: {
					name: "247",
					description: "Aktifkan mode 24/7 di server ini",
					run: {
						enabled: "Mode 24/7 telah diaktifkan untuk server ini",
						disabled: "Mode 24/7 telah dinonaktifkan untuk server ini",
					},
				},
				voicestatus: {
					name: "voicestatus",
					description: "Aktifkan status suara di server ini",
					options: {
						enabled: {
							name: "enabled",
							description:
								"Aktifkan atau nonaktifkan status suara untuk server ini",
						},
					},
					run: {
						enabled: "Status suara telah diaktifkan untuk server ini",
						disabled: "Status suara telah dinonaktifkan untuk server ini",
					},
				},
			},
		},
		// Prefix Commands
		prefix: {
			name: "prefix",
			description: "Atur prefix untuk server ini",
			options: {
				prefix: {
					name: "prefix",
					description: "Masukkan prefix baru",
				},
			},
			run: {
				success: ({ prefix }) => `Berhasil mengatur prefix menjadi: ${prefix}`,
				reset: "Sukses mengatur prefix ke default",
			},
		},
		// Filter Commands
		filter: {
			name: "filter",
			description: "Terapkan filter audio ke musik",
			sub: {
				run: {
					success: ({ filter }) => `Menerapkan filter ${filter}`,
					error: "Terjadi kesalahan saat menerapkan filter",
				},
				_8d: {
					name: "8d",
					description: "Terapkan efek 8D ke musik",
					filter: "8D",
				},
				bassboost: {
					name: "bassboost",
					description: "Tingkatkan frekuensi bass dalam musik",
					filter: "Bassboost",
				},
				karaoke: {
					name: "karaoke",
					description: "Terapkan efek karaoke ke musik",
					filter: "Karaoke",
				},
				nightcore: {
					name: "nightcore",
					description: "Terapkan efek nightcore ke musik",
					filter: "Nightcore",
				},
				pop: {
					name: "pop",
					description: "Terapkan efek pop ke musik",
					filter: "Pop",
				},
				reset: {
					name: "reset",
					description: "Reset filter audio",
					run: {
						success: "Semua filter telah direset",
						error: "Terjadi kesalahan saat mereset filter",
					},
				},
				soft: {
					name: "soft",
					description: "Terapkan efek soft ke musik",
					filter: "Soft",
				},
				treblebass: {
					name: "treblebass",
					description: "Tingkatkan frekuensi treble dan bass dalam musik",
					filter: "Treblebass",
				},
				tremolo: {
					name: "tremolo",
					description: "Terapkan efek tremolo ke musik",
					filter: "Tremolo",
				},
				vaporwave: {
					name: "vaporwave",
					description: "Terapkan efek vaporwave ke musik",
					filter: "Vaporwave",
				},
				vibrato: {
					name: "vibrato",
					description: "Terapkan efek vibrato ke musik",
					filter: "Vibrato",
				},
			},
		},
		// About Commands
		about: {
			name: "about",
			description: "Tampilkan informasi tentang Soundy",
			run: {
				title: "Tentang Soundy",
				footer: ({
					guildCount,
					userCount,
				}: {
					guildCount: number;
					userCount: number;
				}) => `Melayani ${guildCount} server dengan ${userCount} pengguna`,
				about_me: {
					button: "Tentang",
					title: "Tentang Saya",
					1: "Saya adalah bot musik dengan banyak fitur yang dirancang untuk memberikan pengalaman pemutaran musik berkualitas tinggi di Discord.",
					2: "Fitur Utama",
					3: "- Pemutaran musik berkualitas tinggi",
					4: "- Dukungan untuk berbagai sumber musik",
					5: "- Manajemen antrian lanjutan",
					6: "- Sistem peran DJ",
					7: "- Daftar putar kustom",
					8: "- Dan masih banyak lagi!",
					9: "Link",
					10: "Invite",
					11: "Server Support",
					12: "Vote Aku",
					13: "Kredit",
					14: ({ author }: { author: string }) =>
						`- Dikontribusikan oleh: ${author}`,
					15: ({ developer }: { developer: string }) =>
						`- Dikembangkan oleh: ${developer}`,
					16: ({ country }: { country: string }) => `- Negara: ${country}`,
				},
				contributors: {
					button: "Kontributor",
					title: "Kontributor Soundy",
					1: "Terima Kasih Khusus",
					2: ({ author }: { author: string }) => `- ${author}: Pencipta Soundy`,
					3: ({ user }: { user: string }) =>
						`- ${user}: Perbaikan Bug, dan kontribusi lainnya`,
					4: ({ user }: { user: string }) => `- ${user}: Untuk ide bot ini`,
					5: "Link",
					6: "Komunitas Tronix Development",
					7: "Semua kontributor dan supporter",
					8: "Lisensi",
					9: ({ license }: { license: string }) =>
						`Proyek ini dilisensikan di bawah ${license}`,
					10: "Lihat Lisensi",
				},
				packages: {
					button: "Paket",
					title: "Paket & Runtime Soundy",
					1: "Pustaka Inti",
				},
			},
		},
		// Top Commands
		top: {
			name: "top",
			description: "Lihat statistik teratas untuk trek dan pengguna",
			sub: {
				guilds: {
					name: "guilds",
					description:
						"Tampilkan server musik paling aktif dalam 2 minggu terakhir",
					run: {
						title: "Server Musik Teratas",
						description: "Server musik paling aktif dalam 2 minggu terakhir",
						fields: ({
							totalPlays,
							uniqueTracks,
						}: {
							totalPlays: number;
							uniqueTracks: number;
						}) => `Memutar ${totalPlays} trek (${uniqueTracks} unik)`,
						footer: ({ length }) => `Menampilkan ${length} server teratas`,
						unknown: "Server Tidak Dikenal",
						no_data:
							"Tidak ada aktivitas musik yang tercatat dalam 2 minggu terakhir!",
					},
				},
				tracks: {
					name: "tracks",
					description:
						"Tampilkan trek yang paling banyak diputar dalam 2 minggu terakhir",
					run: {
						title: "Trek Teratas",
						description:
							"Trek yang paling banyak diputar dalam 2 minggu terakhir",
						fields: ({ author, playCount, trackId }) =>
							`Oleh ${author} • Diputar ${playCount} kali\n[Link](${trackId})`,
						footer: ({ length }) => `Menampilkan ${length} trek teratas`,
						no_data: "Tidak ada trek yang diputar dalam 2 minggu terakhir!",
					},
				},
				users: {
					name: "users",
					description:
						"Tampilkan pengguna paling aktif dalam 2 minggu terakhir",
					run: {
						title: "Pengguna Musik Teratas",
						description: "Pendengar musik teratas dalam 2 minggu terakhir",
						fields: ({ playCount }) => `Memutar ${playCount} trek`,
						footer: ({ length }) => `Menampilkan ${length} pengguna teratas`,
						unknown: "Pengguna Tidak Dikenal",
						no_data:
							"Tidak ada pengguna yang memutar musik dalam 2 minggu terakhir!",
					},
				},
			},
		},
		// Help Commands
		help: {
			name: "help",
			description: "Dapatkan informasi tentang perintah dan fitur bot kami",
			options: {
				command: {
					name: "command",
					description: "Perintah yang ingin Kamu dapatkan bantuan",
				},
			},
			run: {
				title: "Menu Bantuan Soundy",
				description: {
					1: ({ user, bot }) =>
						`**Haii! ${user} aku ${bot} teman musik kamu!**`,
					2: ({ bot }) =>
						`**${bot} adalah bot musik yang dirancang untuk memberikan pengalaman mendengarkan musik yang luar biasa di Discord. Dengan fitur-fitur yang lengkap dan mudah digunakan, ${bot} adalah pilihan sempurna untuk server Discord mu**`,
					3: "**Pilih Kategori Dari Menu Di Bawah**",
					4: ({
						invite,
						support,
						vote,
					}: {
						invite: string;
						support: string;
						vote: string;
					}) =>
						`**[Invite](${invite}) • [Server Support](${support}) • [Vote](${vote})**`,
				},
				footer: ({ bot }) => `**Terima kasih telah memilih ${bot}!**`,
				select: "Pilih kategori",
				categoryTitle: ({ category }: { category: string }) =>
					`Perintah ${category}`,
				notFound: "Perintah tidak ditemukan!",
				unknown: "Tidak Dikenal",
			},
		},
		// Nodes Commands
		nodes: {
			name: "nodes",
			description: "Periksa status node musik",
			run: {
				title: "Ikhtisar Status Node",
				description: "Pilih node untuk melihat informasi detail",
				fields: ({ players, uptime }) =>
					`\`\`\`js\nPemain: ${players}\nWaktu Aktif: ${uptime}\`\`\``,
				footer: "Pilih node untuk melihat informasi detail",
				status: ({ status }) => `Status: ${status}`,
				connected: "Terhubung",
				disconnected: "Terputus",
				no_nodes: "Tidak ada node yang ditemukan",
			},
		},
		// Ping Commands
		ping: {
			name: "ping",
			description: "Periksa latensi bot dan waktu respons API",
			run: {
				title: "Informasi Latensi Soundy",
				description: {
					1: "Latensi Websocket",
					2: "Latensi Klien",
					3: "Latensi Shard",
				},
				check_title: "Memeriksa Latensi...",
				check_description: "Mohon tunggu sementara aku memeriksa koneksi...",
			},
		},
		// Autoplay Commands
		autoplay: {
			name: "autoplay",
			description: "Aktifkan/nonaktifkan fitur autoplay",
			run: {
				title: "Autoplay",
				enabled: "Autoplay telah diaktifkan",
				disabled: "Autoplay telah dinonaktifkan",
			},
		},
		// Clearqueue Commands
		clearqueue: {
			name: "clearqueue",
			description: "Bersihkan antrean musik saat ini",
		},
		// Forward Commands
		forward: {
			name: "forward",
			description: "Majukan trek saat ini sebanyak 10 detik",
			run: {
				title: "Maju",
				description: ({ forwardPosition, currentTrack }) =>
					`Dimajukan ke ${forwardPosition} / ${currentTrack}`,
				no_song: "Tidak ada lagu yang sedang diputar",
				stream: "Tidak dapat memajukan pada siaran langsung",
			},
		},
		// Grab Commands
		grab: {
			name: "grab",
			description: "Ambil lagu yang sedang diputar dan kirim ke DM Kamu",
			run: {
				title: "Ambil",
				description: {
					1: "Judul",
					2: "Durasi",
					3: "Diminta oleh",
				},
				dm: "Periksa DM Kamu! Detail lagu telah dikirim.",
				dm_failed:
					"Gagal mengirim detail lagu ke DM Kamu. Apakah DM Kamu aktif?",
				no_song: "Tidak ada lagu yang sedang diputar",
			},
		},
		// Join Commands
		join: {
			name: "join",
			description: "Buat bot bergabung ke voice channels mu",
			run: {
				title: "Bergabung",
				description: ({ voiceChannel }) =>
					`Woohoo! Aku telah bergabung di ${voiceChannel}!\nSaatnya menaikkan volume dan membuat keajaiban musik terjadi!`,
			},
		},
		// Leave Commands
		leave: {
			name: "leave",
			description: "Buat bot meninggalkan voice channels",
			run: {
				title: "Meninggalkan Voice Channel",
				description:
					"Pesta telah selesai! Aku telah membersihkan antrean dan meninggalkan saluran.\nSiap kapan saja untuk petualangan musik berikutnya!",
			},
		},
		// Loop Commands
		loop: {
			name: "loop",
			description: "Aktifkan/nonaktifkan mode pengulangan",
		},
		// Lyrics Commands
		lyrics: {
			name: "lyrics",
			description: "Cari lirik lagu",
			options: {
				query: {
					name: "query",
					description:
						"Lagu yang dicari atau URL musik (kosongkan untuk lagu saat ini)",
				},
			},
			run: {
				no_tracks: "Tidak ada trek yang ditemukan",
				invalid_url: "URL yang diberikan tidak valid",
				provide_song:
					"Harap berikan nama lagu atau URL, atau putar lagu terlebih dahulu.",
				error: "Terjadi kesalahan saat mengambil lirik.",
			},
		},
		// Move Commands
		move: {
			name: "move",
			description: "Pindahkan pemain ke voice channel yang berbeda",
			options: {
				voice: {
					name: "voice",
					description: "Pilih voice channel",
				},
				text: {
					name: "text",
					description: "Pilih saluran teks.",
				},
			},
			run: {
				description: ({ voiceChannel, textChannel }) =>
					`Memindahkan pemain ke voice channel ${voiceChannel}${textChannel ? ` dan text channel ${textChannel}` : ""}.`,
			},
		},
		// Nowplaying Commands
		nowplaying: {
			name: "nowplaying",
			description: "Dapatkan lagu yang sedang diputar",
			run: {
				now_playing: "Sedang Diputar",
				artist: "Artis",
				duration: "Durasi",
				requested_by: "Direquest oleh",
			},
		},
		// Pause Commands
		pause: {
			name: "pause",
			description: "Jeda trek saat ini",
			run: {
				paused: "Trek sudah dijeda",
			},
		},
		// Play Commands
		play: {
			name: "play",
			description: "Putar lagu atau playlist",
			options: {
				query: {
					name: "query",
					description: "Masukkan nama trek atau url.",
				},
			},
		},
		// Previous Commands
		previous: {
			name: "previous",
			description: "Putar trek sebelumnya dalam antrean",
		},
		// Queue Commands
		queue: {
			name: "queue",
			description: "Tampilkan antrean musik saat ini",
		},
		// Replay Commands
		replay: {
			name: "replay",
			description: "Putar ulang trek saat ini dari awal",
			run: {
				title: "Memutar Ulang Trek",
			},
		},
		resume: {
			name: "resume",
			description: "Lanjutkan trek yang dijeda",
			run: {
				resumed: "Trek sudah diputar.",
			},
		},
		rewind: {
			name: "rewind",
			description: "Mundurkan trek saat ini sebanyak 10 detik",
			run: {
				title: "Mundur",
				description: ({ rewindPosition, currentTrack }) =>
					`Dimundurkan ke ${rewindPosition} / ${currentTrack}`,
				no_song: "Tidak ada lagu yang sedang diputar",
				no_stream: "Tidak dapat mundur pada siaran langsung",
			},
		},
		// Seek Commands
		seek: {
			name: "seek",
			description: "Cari posisi dalam trek saat ini",
			options: {
				time: {
					name: "time",
					description: "Masukkan waktu. (Contoh: 2min)",
				},
			},
			run: {
				title: "Mencari",
				description: ({ time }) => `Mencari ke ${time}`,
				invalid_time: ({ time }) => `Waktu tidak valid: ${time}`,
				no_track: "Tidak ada trek yang sedang diputar",
				no_seekable: "Trek ini tidak dapat dicari.",
				time_exceeds: ({ time }) => `Waktu melebihi durasi trek: ${time}`,
			},
		},
		// Shuffle Commands
		shuffle: {
			name: "shuffle",
			description: "Acak antrean",
		},
		// Skip Commands
		skip: {
			name: "skip",
			description: "Lewati trek saat ini",
		},
		// Stop Commands
		stop: {
			name: "stop",
			description: "Hentikan pemain",
		},
		// Volume Commands
		volume: {
			name: "volume",
			description: "Atur volume pemain",
			options: {
				volume: {
					name: "volume",
					description: "Masukkan volume",
				},
			},
			run: {
				paused: "Dijeda",
				paused_description:
					"Istirahat sebentar! Musik sedang dijeda untuk saat ini",
			},
		},
		// Playlist Commands
		playlist: {
			name: "playlist",
			description: "Kelola playlist musik mu",
			run: {
				footer: ({ page, total }) =>
					`Halaman ${page} • Total playlist: ${total}`,
				not_found: "Playlist tidak ditemukan",
				no_tracks: "Tidak ada trek yang ditemukan",
			},
			sub: {
				add: {
					name: "add",
					description: "Tambahkan trek ke playlist",
					options: {
						playlist: {
							name: "playlist",
							description: "Nama playlist",
						},
						query: {
							name: "query",
							description: "URL trek, URL playlist, atau kata kunci pencarian",
						},
					},
					run: {
						added: ({ track, playlist }) =>
							`Menambahkan **${track} trek** ke playlist ${playlist}`,
						error: "Terjadi kesalahan saat menambahkan trek ke playlist",
					},
				},
				create: {
					name: "create",
					description: "Buat playlist baru",
					options: {
						name: {
							name: "name",
							description: "Nama playlist",
						},
					},
					run: {
						success: ({ playlist }) =>
							`Berhasil membuat playlist \`${playlist}\``,
						already_exists: "Playlist dengan nama ini sudah ada",
						error: "Terjadi kesalahan saat membuat playlist",
					},
				},
				delete: {
					name: "delete",
					description: "Hapus playlist",
					options: {
						name: {
							name: "name",
							description: "Nama playlist",
						},
					},
					run: {
						deleted: ({ playlist }) => `Menghapus playlist \`${playlist}\``,
						error: "Terjadi kesalahan saat menghapus playlist.",
					},
				},
				list: {
					name: "list",
					description: "Tampilkan semua playlist mu",
					run: {
						title: ({ author }) => `Playlist ${author}`,
						list: ({ playlist, tracks }) => `${playlist} - ${tracks} trek`,
						no_playlists: "Kamu tidak memiliki playlist",
						error: "Terjadi kesalahan saat mengambil playlist mu",
					},
				},
				load: {
					name: "load",
					description: "Muat dan putar playlist",
					options: {
						name: {
							name: "name",
							description: "Nama playlist",
						},
					},
					run: {
						loaded: ({ tracks, playlist }) =>
							`Memuat **${tracks} trek** dari playlist ${playlist}`,
						error: "Terjadi kesalahan saat memuat playlist",
					},
				},
				remove: {
					name: "remove",
					description: "Hapus trek dari playlist",
					options: {
						name: {
							name: "name",
							description: "Nama playlist",
						},
						track: {
							name: "track",
							description: "Nomor trek yang akan dihapus",
						},
					},
					run: {
						removed: ({ name }) => `Menghapus trek dari playlist ${name}`,
						invalid: "Nomor trek tidak valid",
						error: "Terjadi kesalahan saat menghapus trek dari playlist",
					},
				},
				view: {
					name: "view",
					description: "Lihat trek dalam playlist",
					options: {
						name: {
							name: "name",
							description: "Nama playlist",
						},
					},
					run: {
						title: ({ name }) => `Playlist: ${name}`,
						empty: "Playlist ini kosong",
						failed: "Gagal memuat detail trek",
						error: "Terjadi kesalahan saat melihat playlist",
					},
				},
			},
		},
		// Report Commands
		report: {
			name: "report",
			description: "Laporkan bug, pengguna atau saran",
			sub: {
				bug: {
					name: "bug",
					description: "Laporkan bug yang kamu temukan di bot",
					run: {
						label: "Laporkan Bug",
						init_title: "Laporan Bug",
						init_description:
							"Klik tombol di bawah untuk melaporkan bug yang kamu temukan di bot",
						description: "Jelaskan bug yang kamu temui",
						description_placeholder: "Apa yang terjadi? Apa yang kamu alami?",
						steps: "Langkah-langkah untuk mereproduksi bug",
						steps_placeholder:
							"1. Langkah pertama\n2. Langkah kedua\n3. Langkah ketiga...",
						success: "Laporan Bug Terkirim",
						error: "Kesalahan Mengirim Laporan Bug",
						success_description: ({ reportId }) =>
							`Laporan bug kamu telah berhasil dikirim.\n\n**ID Laporan:** ${reportId}`,
						error_description:
							"Terjadi kesalahan saat mengirim laporan bug kamu. Silakan coba lagi nanti",
						invalid_user:
							"Hanya pengguna yang memulai perintah ini yang dapat melaporkan bug",
					},
				},
				suggestion: {
					name: "suggestion",
					description: "Berikan saran yang ingin kamu berikan ke bot",
					run: {
						label: "Berikan Saran",
						init_title: "Saran",
						init_description:
							"Klik tombol di bawah untuk memberikan saran yang ingin kamu berikan ke bot",
						description: "Jelaskan saran yang kamu miliki",
						description_placeholder:
							"Apa yang ingin kamu lihat ditambahkan atau ditingkatkan?",
						steps: "Langkah-langkah untuk mereproduksi bug",
						steps_placeholder:
							"1. Langkah pertama\n2. Langkah kedua\n3. Langkah ketiga...",
						success: "Saran Terkirim",
						error: "Kesalahan Mengirim Saran",
						success_description: ({ reportId }) =>
							`Saran kamu telah berhasil dikirim.\n\n**ID Laporan:** ${reportId}`,
						error_description:
							"Terjadi kesalahan saat mengirim saran kamu. Silakan coba lagi nanti",
						invalid_user:
							"Hanya pengguna yang memulai perintah ini yang dapat memberikan saran",
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
				"Bergabung dengan voice channel dan antri lagu berdasarkan nama atau url di voice channel ini.",
			no_voice: "Kamu harus berada di voice channel untuk menggunakan ini!",
			no_connect:
				"Aku membutuhkan izin `CONNECT` dan `SPEAK` di voice channel kamu!",
			failed: "Gagal bergabung ke voice channel kamu!",
			no_results: ({ query }) =>
				`Tidak ada hasil yang ditemukan untuk ${query}`,
			error: "Terjadi kesalahan saat memproses permintaan kamu!",
		},
		// Music Events
		music: {
			title: "Judul",
			artist: "Artis",
			duration: "Durasi",
			requested_by: "Diminta oleh",
			now_playing: "Sedang Diputar",
			node: "Node",
			finish_time: "Waktu Selesai",
			tracks: "Trek",
			added: "Ditambahkan ke Antrean",
			added_playlist: "Playlist Ditambahkan ke Antrean",
			added_songs: ({ songs }) => `${songs} lagu`, // 79 lagu
			no_results: "Tidak ada hasil yang ditemukan untuk kueri yang diberikan.",
			pause: {
				title: "Trek Dijeda",
				description:
					"Ritme telah ditunda dengan lembut!\nPerjalanan musik kamu sedang dalam jeda ajaib.",
			},
			resume: {
				title: "Trek Dilanjutkan",
				description: "Musik telah dilanjutkan!\nMari kita lanjutkan pestanya!",
			},
		},
		cooldown: ({ seconds }) =>
			`Harap tunggu ${seconds} detik sebelum menggunakan perintah ini lagi.`,
		// Manager
		manager: {
			no_nodes:
				"Tidak ada node yang tersedia saat ini. Silakan coba lagi nanti.",
			no_player: "Tidak ada pemain musik aktif di server ini.",
			no_tracks: "Tidak ada trek dalam antrean.",
			not_enough:
				"Tidak cukup trek dalam antrean untuk melakukan tindakan ini.",
		},
		// Premium
		premium: {
			limit_reached: {
				title: "Kamu telah menggunakan semua perintah gratis kamu!",
				description: ({ time }) =>
					`Silakan vote untuk Soundy di top.gg untuk mendapatkan ${time} jam akses tanpa batas.`,
			},
			vote_now: "Vote Sekarang",
		},
		// Verifications
		verifications: {
			only_developer: "Perintah ini hanya tersedia untuk pengembang.",
			only_guild_owner: "Perintah ini hanya tersedia untuk pemilik server.",
		},
		// Voice
		voice: {
			no_same: ({ channel }) =>
				`Kamu harus berada di voice channel yang sama dengan ku di ${channel}!`,
			no_vc:
				"Kamu harus berada di voice channel untuk menggunakan perintah ini!",
			no_perms: ({ channel }) =>
				`Aku tidak memiliki izin yang diperlukan di ${channel}!`,
			missing_perms: "Izin Tidak Mencukupi",
			failed: "Gagal bergabung ke voice channel kamu!",
		},
		// Listeners
		listeners: {
			no_members: "Tidak ada anggota yang tersisa di voice channel",
			disconnect: ({ time }) =>
				`Voice channel kosong! Pemain akan diputuskan dalam ${time}`,
			resume: "Anggota bergabung! Melanjutkan pemutaran",
		},
		// Mention
		mention: {
			title: "Selamat datang di Soundy!",
			description: {
				1: ({ prefix }) =>
					`Gunakan \`${prefix}help\` atau \`/help\` untuk menemukan semua perintah luar biasa ku`,
				2: "Butuh bantuan? Bergabunglah dengan Server Dukungan kami untuk bantuan",
				3: ({ prefix }) =>
					`Ingin memulai? Cukup ketik \`${prefix}play\` atau \`/play\` untuk memulai perjalanan musik kamu!`,
				4: "Fitur:",
				5: "Streaming musik berkualitas tinggi",
				6: "Manajemen daftar putar yang kaya",
				7: "Dukungan untuk berbagai platform",
			},
			footer:
				"Putar musik berkualitas tinggi di server Discord kamu secara gratis.",
			button: {
				add: "Invite ke Server",
				support: "Server Support",
				vote: "Vote",
			},
		},
		// Overrides
		overrides: {
			error: "Terjadi kesalahan saat menjalankan perintah ini",
			missing_perms: "Izin Tidak Mencukupi",
			missing_user_perms:
				"Kamu tidak memiliki izin yang diperlukan untuk menggunakan perintah ini",
			missing_bot_perms:
				"Aku tidak memiliki izin yang diperlukan untuk menggunakan perintah ini",
			invalid_command: {
				1: "Penggunaan perintah tidak valid. Berikut cara menggunakannya:",
				2: "Opsi:",
			},
		},
		// Paginator
		paginator: {
			only_author:
				"Maaf, hanya pembuat perintah yang dapat menggunakan menu ini.",
		},
	},
	// Components
	component: {
		// Clear Queue
		clear: {
			description: "Antrian telah dibersihkan",
		},
		// Loop
		loop: {
			title: "Mode Loop Diperbarui",
			description: ({ mode }) => `Mode loop diperbarui ke ${mode}`,
			select_title: "Pilihan Mode Loop",
			select_description: "Pilih mode loop untuk diubah:",
			off: "Mati",
			track: "Lagu",
			queue: "Antrian",
			loop_off: "Loop saat ini dinonaktifkan",
			loop_track: "Saat ini mengulang lagu yang sedang diputar",
			loop_queue: "Saat ini mengulang seluruh antrian",
		},
		// Previous
		previous: {
			title: "Memutar lagu sebelumnya",
			description:
				"Mengulang perjalanan musik kembali ke awal!\nSaatnya menikmati lagu keren ini sekali lagi!",
			no_previous: "Tidak ada lagu sebelumnya",
			no_previous_description:
				"Ups! Tidak ada lagu sebelumnya untuk diputar!\nMari lanjutkan dengan lagu yang sedang diputar!",
		},
		// Queue
		queue: {
			name: "Antrian",
			now_playing: "Sedang Diputar",
			total: ({ total }) => `Total lagu: ${total}`,
			track: ({ track, author }) => `${track} oleh ${author}`,
			requested_by: ({ user }) => `Diminta oleh ${user}`,
			up_next: "Berikutnya",
			unknown_artist: "Artis Tidak Dikenal",
		},
		// Shuffle
		shuffle: {
			description:
				"Antrian telah diacak!\nMari lanjutkan pesta dengan campuran baru!",
		},
		skip: {
			title: "Dilewati",
			description: "Melompat ke lagu berikutnya dalam antrian",
			autoplay: "Melompat ke lagu rekomendasi yang keren",
			end: "Selesai! Kita telah mencapai akhir perjalanan musik kita untuk saat ini.\nSaatnya memulai yang baru dengan lagu-lagu segar!",
		},
		stop: {
			title: "Dihentikan",
			description:
				"Pesta telah selesai! Aku telah membersihkan antrian dan membereskan speaker.\nSiap kapanpun kamu ingin memulai petualangan musik lainnya!",
		},
		// Volume
		volume: {
			title: "Volume Diatur",
			description: ({ volume }) => `Volume telah diatur ke ${volume}%`,
		},
		// Lyrics
		lyrics: {
			title: ({ song }) => `Lirik untuk ${song}`,
			description: "Lirik untuk lagu saat ini atau lagu tertentu",
			no_lyrics: "Tidak ada lirik yang ditemukan untuk lagu ini.",
		},

		// Node Select
		nodeSelect: {
			title: ({ node }) => `Informasi Node - ${node}`,
			status: ({ status }) => `Status: ${status}`,
			connected: "Terhubung",
			disconnected: "Terputus",
			description: "Pilih node untuk melihat informasi detail",
			players: ({ players }) => `Pemain: ${players}`,
			playing_players: ({ playingPlayers }) =>
				`Pemain Aktif: ${playingPlayers}`,
			uptime: ({ uptime }) => `Waktu Aktif: ${uptime}`,
			cpu: "CPU",
			cores: ({ cores }) => `Inti: ${cores}`,
			system_load: ({ systemLoad }) => `Load Sistem: ${systemLoad}%`,
			lavalink_load: ({ lavalinkLoad }) => `Load Lavalink: ${lavalinkLoad}%`,
			memory: "Memori",
			used: ({ used }) => `Terpakai: ${used}`,
			reservable: ({ reservable }) => `Dapat Direservasi: ${reservable}`,
			no_node: "Node ini tidak lagi tersedia.",
		},
	},
	// Middleware
	middlewares: {
		cooldown: {
			description: ({ seconds }) =>
				`Mohon tunggu ${seconds} detik sebelum menggunakan perintah ini lagi.`,
		},
	},
	// Autocomplete
	autocomplete: {
		music: {
			no_nodes: "Tidak ada node yang tersedia",
			no_voice: "Tidak ada voice channel",
			no_tracks: "Tidak ada lagu yang ditemukan",
		},
	},
} satisfies typeof English;
