export default {
	metadata: {
		name: "Thai",
		code: "th-TH",
		translators: ["OatMealXXII"],
	},
	// Commands
	cmd: {
		// Requested By
		requested_by: ({ user }: { user: string }) => `ส่งคำขอโดย ${user}`,
		// Error
		error: "เกิดข้อผิดพลาดในการประมวลผลคำสั่ง โปรดลองใหม่อีกครั้ง",
		// Default Commands
		default: {
			name: "default",
			description: "กำหนดค่าของค่าเริ่มต้น",
			sub: {
				name: "volume",
				description: "เปลี่ยนระดับเสียง",
				options: {
					volume: {
						name: "volume",
						description: "ใส่ระดับของเสียง",
					},
				},
				run: {
					description: ({ volume }: { volume: number }) =>
						`ค่าเรอ่มต้นของเสียงถูกกำหนดเป็น ${volume}%`,
				},
			},
		},
		// Setup Commands
		setup: {
			name: "setup",
			description: "การสร้างหรือลบห้องสั่งเพลง",
			sub: {
				create: {
					name: "create",
					description: "สร้างห้องสั่งเพลง",
					run: {
						exists: "มีห้องสั่งเพลงอยู่แล้ว",
						failed: "การสร้างห้องสั่งเพลงล้มเหลว",
						topic: "Soundy Music Player - พิมพ์ชื่อเพลงหรือใส่ URL เพลง",
						success: ({ channel }: { channel: string }) =>
							`สร้างห้องสั่งเพลงสำเร็จ ${channel}`,
					},
				},
				delete: {
					name: "delete",
					description: "ลบห้องสั่งเพลง",
					run: {
						exists: "ไม่มีห้องสั่งเพลงอยู่",
						success: "ลบห้องสั่งเพลงสำเร็จ",
						failed: "การลบห้องสั่งเพลงล้มเหลว",
					},
				},
			},
		},
		// Toggle Commands
		toggle: {
			name: "toggle",
			description: "เปิดใช้งานฟีเจอร์",
			sub: {
				_247: {
					name: "247",
					description: "เปิดโหมด 24/7 ในเซิฟเวอร์นี้",
					run: {
						enabled: "เปิดใช้งานโหมด 24/7 สำหรับเซิฟเวอร์นี้แล้ว",
						disabled: "ปิดใช้งาน 24/7 สำหรับเซิฟเวอร์นี้แล้ว",
					},
				},
				voicestatus: {
					name: "voicestatus",
					description: "เปิดสถานะเสียงสำหรับเซิฟเวอร์",
					options: {
						enabled: {
							name: "enabled",
							description: "เปิดใช้งานหรือปิดใช้งานสถานะเสียงสำหรับเซิฟเวอร์",
						},
					},
					run: {
						enabled: "เปิดใช้งานสถานะเสียงสำหรับเซิฟเวอร์",
						disabled: "ปิดใช้งานสถานะเสียงสำหรับเซิฟเวอร์",
					},
				},
			},
		},
		// Prefix Commands
		prefix: {
			name: "prefix",
			description: "ตั้งค่าตัวอัษรนำหน้า",
			options: {
				prefix: {
					name: "prefix",
					description: "ใส่คำนำหน้าใหม่",
				},
			},
			run: {
				success: ({ prefix }: { prefix: string }) =>
					`สำเร็จ! ในการตั้งคำนำหน้าเป็น: ${prefix}`,
				reset: "คำนำหน้าถูกรีเซ็ตสู่ค่าเริ่มต้นแล้ว",
			},
		},
		// Filter Commands
		filter: {
			name: "filter",
			description: "ใช้งานฟิลเตอร์เสียง",
			sub: {
				run: {
					success: ({ filter }: { filter: string }) =>
						`ใช้งานฟิลเตอร์ ${filter} แล้ว`,
					error: "เกิดข้อผิดพลาดในการใช้งานฟิลเตอร์",
				},
				_8d: {
					name: "8d",
					description: "ใช้งานเอฟเฟค 8D ในเพลง",
					filter: "8D",
				},
				bassboost: {
					name: "bassboost",
					description: "ใช้งานฟิลเตอร์เพิ่มเบสของเพลง",
					filter: "Bassboost",
				},
				karaoke: {
					name: "karaoke",
					description: "ใช้งานฟิลเตอร์คาราโอเกะ",
					filter: "Karaoke",
				},
				nightcore: {
					name: "nightcore",
					description: "ใช้งานฟิลเตอร์ไนท์คอร์",
					filter: "Nightcore",
				},
				pop: {
					name: "pop",
					description: "ใช้งานฟิลเตอร์เพลงป๊อป",
					filter: "Pop",
				},
				reset: {
					name: "reset",
					description: "รีเซ็ตฟิลเตอร์เสียงทั้งหมด",
					run: {
						success: "ฟิลเตอร์เสียงถูกรีเซ็ตแล้ว",
						error: "เกิดข้อผิดพลาดในการรีเซ็ตฟิลเตอร์เพลง",
					},
				},
				soft: {
					name: "soft",
					description: "ใช้งานฟิลเตอร์เสียงนุ่มนวล",
					filter: "Soft",
				},
				treblebass: {
					name: "treblebass",
					description: "ใช้งานฟิลเตอร์เพิ่มย่านต่ำและย่านสูง",
					filter: "Treblebass",
				},
				tremolo: {
					name: "tremolo",
					description: "ใช้งานเอฟเฟค Tremolo",
					filter: "Tremolo",
				},
				vaporwave: {
					name: "vaporwave",
					description: "ใช้งานเอฟเฟค Vaporwave",
					filter: "Vaporwave",
				},
				vibrato: {
					name: "vibrato",
					description: "ใช้งานเอฟเฟค Vibrato",
					filter: "Vibrato",
				},
			},
		},
		// About Commands
		about: {
			name: "about",
			description: "โชว์เกี่ยวกับบอท Soundy",
			run: {
				title: "เกี่ยวกับ Soundy",
				footer: ({
					guildCount,
					userCount,
				}: {
					guildCount: number;
					userCount: number;
				}) => `กำลังอยู่ใน ${guildCount} เซิฟเวอร์ และเชื่อมต่อกับผู้ใช้ ${userCount} บัญชี`,
				about_me: {
					button: "เกี่ยวกับ",
					title: "เกี่ยวกับฉัน",
					1: "ฉันคือบอทที่มีฟีเจอร์มากมายและสร้างมาเพื่อการสร้างประสบการณ์ที่ดีต่อผู้ใช้ Discord ทุกคน",
					2: "ระบบเด่นๆ",
					3: "- การเล่นเพลงคุณภาพสูง",
					4: "- รองรับแหล่งเพลงมากมาย",
					5: "- ระบบจัดการคิวขั้นสูง",
					6: "- ระบบยศ DJ",
					7: "- เพลลิสต์แบบกำหนดเอง",
					8: "- และอีกมากมาย",
					9: "ลิงค์",
					10: "เชิญฉันเข้าเซิฟเวอร์",
					11: "เซิฟเวอร์สนับสนุน",
					12: "โหวตฉัน",
					13: "เครดิต",
					14: ({ author }: { author: string }) => `- ก่อตั้งโดย: ${author}`,
					15: ({ developer }: { developer: string }) =>
						`- พัฒนาโดย: ${developer}`,
					16: ({ country }: { country: string }) => `- ประเทศ: ${country}`,
				},
				contributors: {
					button: "ผู้มีส่วนร่วม",
					title: "ผู้มีส่วนร่วม Soundy",
					1: "ผู้มีส่วนร่วมเป็นพิเศษ",
					2: ({ author }: { author: string }) => `- ${author}: ผู้สร้างบอท Soundy`,
					3: ({ user }: { user: string }) =>
						`- ${user}: ผู้แก้ไขข้อผิดพลาดและในส่วนอื่นๆ`,
					4: ({ user }: { user: string }) => `- ${user}: ผู้มีส่วนร่วมในการทำโค้ด`,
					5: "ลิงค์",
					6: "Tronix Development Community",
					7: "ผู้มีส่วนร่วมและผู้สนับสนุนทั้งหมด",
					8: "License",
					9: ({ license }: { license: string }) =>
						`โปรเจกต์นี้อยู่ภาบใต้ใบอนุญาต ${license}`,
					10: "ดูใบอนุญาต",
				},
				packages: {
					button: "แพ็กเกจ",
					title: "แพ็กเกจและตัวรันของ Soundy",
					1: "Core Libraries",
				},
			},
		},
		// Top Commands
		top: {
			name: "top",
			description: "ดูสถิติที่ติดอันดับและการติดตามผู้ใช้",
			sub: {
				guilds: {
					name: "guilds",
					description: "โชว์เซิฟเวอร์ที่เล่นเพลงมากที่สุดใน 2 อาทิตย์ล่าสุด",
					run: {
						title: "เซิฟเวอร์เล่นเพลงที่ติดอันดับ",
						description: "แสดงเซิฟเวอร์ที่เล่นเพลงมากที่สุดใน 2 อาทิตย์ล่าสุด",
						fields: ({
							totalPlays,
							uniqueTracks,
						}: {
							totalPlays: number;
							uniqueTracks: number;
						}) =>
							`เล่นเพลงไปแล้วทั้งหมด ${totalPlays} เพลง (${uniqueTracks} เพลงพิเศษ)`,
						footer: ({ length }: { length: number }) =>
							`แสดงเซิฟเวอร์ติดอันดับ ${length} เซิฟเวอร์`,
						unknown: "ไม่รู้จักเซิฟเวอร์",
						no_data: "ไม่มีการบันทึกการเล่นเพลงใดๆเลยใน 2 อาทิตย์ล่าสุด",
					},
				},
				tracks: {
					name: "tracks",
					description: "แสดงเพลงที่เล่นมากที่สุดใน 2 อาทิตย์ล่าสุด",
					run: {
						title: "เพลงที่ติดอันดับ",
						description: "แสดงเพลงที่เล่นมากที่สุดใน 2 อาทิตย์ล่าสุด",
						fields: ({
							author,
							playCount,
							trackId,
						}: {
							author: string;
							playCount: number;
							trackId: string;
						}) =>
							`โดย ${author} • เล่นไปแล้ว ${playCount} ครั้ง\n[Link](${trackId})`,
						footer: ({ length }: { length: number }) =>
							`แสดงอันดับ ${length} แทร็ก`,
						no_data: "ไม่มีเพลงใดเลยที่เล่นมากที่สุดใน 2 อาทิตย์ล่าสุด",
					},
				},
				users: {
					name: "users",
					description: "แสดงผู้ใช้ที่ใช้งานมากที่สุดใน 2 อาทิตย์ล่าสุด",
					run: {
						title: "Top Music Users",
						description: "แสดงคนที่ฟังเพลงมากที่สุดใน 2 อาทิตย์ล่าสุด",
						fields: ({ playCount }: { playCount: number }) =>
							`เล่นไปแล้ว ${playCount} เพลง`,
						footer: ({ length }: { length: number }) =>
							`แสดงอันดับ ${length} ผู้ใช้`,
						unknown: "ไม่รู้จักผู้ใช้",
						no_data: "ไม่มีผู้ใช้ใดเลยที่ฟังเพลงมากที่สุดใน 2 อาทิตย์ล่าสุด",
					},
				},
			},
		},
		// Help Commands
		help: {
			name: "help",
			description: "รับข้อมูลเกี่ยวกับฟีเจอร์ต่างๆของ Soundy",
			options: {
				command: {
					name: "command",
					description: "แสดงคำสั่งต่างๆ",
				},
			},
			run: {
				title: "เมนูช่วยเหลือของ Soundy",
				description: {
					1: ({ user, bot }: { user: string; bot: string }) =>
						`**ซาหวัดดี! ${user} ฉันคือ ${bot} เป็นเพื่อนนักดนตรีของคุณ!**`,
					2: ({ bot }: { bot: string }) =>
						`**${bot} เป็นบอทเพลงที่ออกมาเพื่อประสบการณ์ที่ยอดเยี่ยมใน Discord และมีฟีเจอร์ที่ใช้ง่ายมาก ${bot} เป็นตัวเลือกที่ตอบโจทย์สำหรับเซิฟเวอร์ Discord ของคุณ**`,
					3: "**เลือกหมวดหมู่จากเมนูด้านล่างนี้**",
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
				footer: ({ bot }: { bot: string }) => `ขอบคุณที่คุณเลือกเรา ${bot}!`,
				select: "เลือกหมวดหมู่",
				categoryTitle: ({ category }: { category: string }) =>
					`${category} คำสั่ง`,
				notFound: "ไม่พบคำสั่ง",
				unknown: "ไม่รู้จัก!",
			},
		},
		// Nodes Commands
		nodes: {
			name: "nodes",
			description: "เช็คสถานะ Nodeเพลง",
			run: {
				title: "ภาพรวมสถานะของ Node เพลง",
				description: "เลือก Node เพื่อดูข้อมูลและรายละเอียด",
				fields: ({ players, uptime }: { players: number; uptime: string }) =>
					`\`\`\`js\nตัวเล่นเพลง: ${players}\nเวลาที่ทำงานมาแล้ว: ${uptime}\`\`\``,
				footer: "เลือก Node เพื่อดูข้อมูลและรายละเอียด",
				status: ({ status }: { status: string }) => `สถานะ: ${status}`,
				connected: "เชื่อมต่อแล้ว",
				disconnected: "ไม่ได้เชื่อมต่ออยู่",
				no_nodes: "ไม่พบ Node!",
			},
		},
		// Ping Commands
		ping: {
			name: "ping",
			description: "เช็คความหน่วงของบอทและการตอบสนองของ API",
			run: {
				title: "ข้อมูลลความหน่วงของ Soundy",
				description: {
					1: "ความหน่วงของ Websocket",
					2: "ความหน่วงของ Client",
					3: "ความหน่วงของ Shard",
				},
				check_title: "กำลังเช็คความหน่วง...",
				check_description: "โปรดรอในขณะที่ฉันกำลังเช็คการเชื่อมต่อ...",
			},
		},
		// Autoplay Commands
		autoplay: {
			name: "autoplay",
			description: "ใช้งานฟีเจอร์เล่นอัตโนมัติ",
			run: {
				title: "เล่นอัตโนมัติ",
				enabled: "การเล่นอัตโนมัติถูกเปิดใช้งานแล้ว",
				disabled: "การเล่นอัตโนมัติถูกปิดใช้งานแล้ว",
			},
		},
		// Clearqueue Commands
		clearqueue: {
			name: "clearqueue",
			description: "เคลียร์คิวเพลงในปัจจุบัน",
		},
		// Forward Commands
		forward: {
			name: "forward",
			description: "เร่งความเร็วของเพลงปัจจุบันไปข้างหน้า 10 วินาที",
			run: {
				title: "เร่งความเร็วไปข้างหน้า",
				description: ({
					forwardPosition,
					currentTrack,
				}: {
					forwardPosition: number;
					currentTrack: string;
				}) => `เร่งไปที่: ${forwardPosition} / ${currentTrack}`,
				no_song: "ไม่มีเพลงปัจจุบันที่เล่นอยู่",
				stream: "ไม่สามารถข้ามไลฟ์สตรีมได้",
			},
		},
		// Grab Commands
		grab: {
			name: "grab",
			description: "หยิบเพลงที่เล่นปัจจุบันและส่งรายละเอียดมันมาที่ไปที่ DM",
			run: {
				title: "หยิบเพลง",
				description: {
					1: "ชื่อเพลง",
					2: "ระยะเวลา",
					3: "ขอเพลงมาโดย",
				},
				dm: "รายละเอียดเพลงถูกส่งไปแล้วโปรด เช็ค DM",
				dm_failed:
					"ล้มเหวในการส่งรายละเอียดเพลงไปยัง DM ของคุณ โปรดตรวจสอบว่าคุณเปิดใช้งาน DM แล้ว",
				no_song: "ไม่มีเพลงที่เล่นอยู่ในปัจจุบัน",
			},
		},
		// Join Commands
		join: {
			name: "join",
			description: "ทำให้บอทเข้าร่วมมาในช่องเสียงที่คุณอยู่",
			run: {
				title: "เข้าร่วม",
				description: ({ voiceChannel }: { voiceChannel: string }) =>
					`วู้ฮู้! ฉันทำลายปาร์ตี้ใน ${voiceChannel}! แล้ว\nถึงเวลาที่จะเปิดเพลงให้ดังขึ้นแล้วสร้างเวทมนตร์แห่งดนตรีกัน!`,
			},
		},
		// Leave Commands
		leave: {
			name: "leave",
			description: "ทำให้บอทออกจากช่องเสียงที่คุณอยู่",
			run: {
				title: "ออกจากช่องเสียงที่คุณอยู่",
				description:
					"ปาร์ตี้จบลงแล้ว! ฉันเคลียร์คิวและออกจากช่องแล้ว\nเจอกันเมื่อคุณพร้อมสำหรับการผจญภัยในครั้งต่อไป!",
			},
		},
		// Loop Commands
		loop: {
			name: "loop",
			description: "ใช้งานโหมดนวนซ้ำ",
		},
		// Lyrics Commands
		lyrics: {
			name: "lyrics",
			description: "หาเนื้อเพลงสำหรับเพลงปัจจุบัน",
			options: {
				query: {
					name: "query",
					description: "เพลงที่จะค้นหาหรือ URL เพลง (ไม่ต้องใส่สำหรับเพลงปัจจุบัน)",
				},
			},
			run: {
				title: ({ song }: { song: string }) => `เนื้อเพลงสำหรับ: ${song}`,
				description: "เนื้อเพลงสำหรับเพลงปัจจุบันหรือเพลงที่ระบุ",
				footer: ({ user, provider }: { user: string; provider: string }) =>
					`ส่งคำขอมาโดย ${user} | ขับเคลื่อนโดย ${provider}`,
				no_tracks: "ไม่พบเพลง",
				invalid_url: "URL ที่ให้มาไม่ถูกต้อง",
				provide_song: "กรุณาระบุชื่อเพลงหรือ URL หรือเล่นเพลงก่อน",
				no_lyrics: "ไม่เจอเนื้อเพลงสำหรับเพลงนี้",
				error: "เกิดข้อผิดพลาดในระหว่างการค้นหาเนื้อเพลง",
			},
		},
		// Move Commands
		move: {
			name: "move",
			description: "ขยับตัวเล่นเพลงไปยังห้องอื่นๆ",
			options: {
				voice: {
					name: "voice",
					description: "เลือกห้อง VC",
				},
				text: {
					name: "text",
					description: "เลือกห้องข้อความ",
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
					`ขยับตัวเล่นเพลงไปที่ห้อง ${voiceChannel}${textChannel ? ` และห้องข้อความเป็น ${textChannel}` : ""}.`,
			},
		},
		// Nowplaying Commands
		nowplaying: {
			name: "nowplaying",
			description: "รับข้อมูลเพลงที่กำลังเล่นปัจจุบัน",
			run: {
				now_playing: "ตอนนี้กำลังเล่น",
				artist: "ศิลปิน",
				duration: "ระยะเวลา",
				requested_by: "ส่งคำขอโดย",
			},
		},
		// Pause Commands
		pause: {
			name: "pause",
			description: "หยุดชั่วคราวเพลงในปัจจุบัน",
			run: {
				paused: "เพลงถูกพักไว้ชั่วคราวอยู่แล้ว",
			},
		},
		// Play Commands
		play: {
			name: "play",
			description: "เล่นเพลงหรือเพลย์ลิสต์",
			options: {
				query: {
					name: "query",
					description: "ใส่ชื่อของเพลงหรือ URL",
				},
			},
		},
		// Previous Commands
		previous: {
			name: "previous",
			description: "เล่นเพลงที่แล้วในคิว",
		},
		// Queue Commands
		queue: {
			name: "queue",
			description: "แสดงคิวเพลงในปัจจุบัน",
		},
		// Replay Commands
		replay: {
			name: "replay",
			description: "เล่นเพลงซ้ำตั้งแต่ต้น",
			run: {
				title: "เล่นเพลงอีกครั้ง",
			},
		},
		resume: {
			name: "resume",
			description: "เล่นเพลงต่อจากที่หยุดชั่วคราวไว้",
			run: {
				resumed: "เพลงเล่นอยู่แล้ว!",
			},
		},
		rewind: {
			name: "rewind",
			description: "ย้อเวลาเพลงไป 10 นาที",
			run: {
				title: "ย้อนเวลา",
				description: ({
					rewindPosition,
					currentTrack,
				}: {
					rewindPosition: string;
					currentTrack: string;
				}) => `ย้อนเพลงไปยัง ${rewindPosition} / ${currentTrack}`,
				no_song: "ไม่มีเพลงที่เล่นอยู่ในปัจจุบัน",
				no_stream: "ไม่สามารถย้อนไลฟ์สตรีมได้!",
			},
		},
		// Seek Commands
		seek: {
			name: "seek",
			description: "ข้ามไปยังเวลาต่างๆในเพลง",
			options: {
				time: {
					name: "time",
					description: "ใส่เวลา (เช่น: 2min)",
				},
			},
			run: {
				title: "Seek",
				description: ({ time }: { time: string }) => `ข้ามไปยัง ${time}`,
				invalid_time: ({ time }: { time: string }) => `เวลาไม่ถูกต้อง: ${time}`,
				no_track: "ไม่มีเพลงที่เล่นอยู่ในปัจจุบัน",
				no_seekable: "เพลงนี้ไม่สามารถข้ามไปไหนได้",
				time_exceeds: ({ time }: { time: string }) =>
					`เวลาเกินกว่าความยาวของเพลง: ${time}`,
			},
		},
		// Shuffle Commands
		shuffle: {
			name: "shuffle",
			description: "สลับเพลงในคิว",
		},
		// Skip Commands
		skip: {
			name: "skip",
			description: "ข้ามจากเพลงปัจจุบันไปเพลงต่อไป",
		},
		// Stop Commands
		stop: {
			name: "stop",
			description: "หยุดตัวเล่น",
		},
		// Volume Commands
		volume: {
			name: "volume",
			description: "ตั้งระดับเสียงของตัวเล่น",
			options: {
				volume: {
					name: "volume",
					description: "ใส่ค่าระดับเสียง",
				},
			},
			run: {
				paused: "พักชั่วคราว",
				paused_description: "พักหายใจแป๊บนึง! เพลงหยุดชั่วคราวก่อนนะ",
			},
		},
		// Playlist Commands
		playlist: {
			name: "playlist",
			description: "จัดการเพลย์ลิสต์เพลงของคุณ",
			run: {
				footer: ({ page, total }: { page: string; total: number }) =>
					`หน้า ${page} • จำนวนเพลย์ลิสต์ทั้งหมด: ${total}`,
				not_found: "ไม่พบเพลย์ลิสต์",
				no_tracks: "ไม่พบเพลง",
			},
			sub: {
				add: {
					name: "add",
					description: "เพิ่มเพลงลงในเพลย์ลิสต์",
					options: {
						playlist: {
							name: "playlist",
							description: "ชื่อของเพลย์ลิสต์",
						},
						query: {
							name: "query",
							description: "URL ของเพลง, URL ของเพลย์ลิสต์, หรือ คำค้นหา",
						},
					},
					run: {
						added: ({ track, playlist }: { track: string; playlist: string }) =>
							`เพิ่มเพลง **${track}** ลงในเพลย์ลิสต์ ${playlist}`,
						// - Added **1 tracks** to playlist **Tonikaku Kawaii**
						// - Added track **Unmei?** to playlist **Tonikaku Kawaii**
						error: "เกิดข้อผิดพลาดขณะเพิ่มเพลงลงในเพลย์ลิสต์",
					},
				},
				create: {
					name: "create",
					description: "สร้างเพลย์ลิสต์ใหม่",
					options: {
						name: {
							name: "name",
							description: "ชื่อของเพลย์ลิสต์",
						},
					},
					run: {
						success: ({ playlist }: { playlist: string }) =>
							`สร้างเพลย์ลิสต์ \`${playlist}\` สำเร็จ`,
						already_exists: "มีเพลย์ลิสต์ที่มีชื่อเดียวกันนี้อยู่แล้ว",
						error: "เกิดข้อผิดพลาดขณะสร้างเพลย์ลิสต์",
					},
				},
				delete: {
					name: "delete",
					description: "ลบเพลย์ลิสต์",
					options: {
						name: {
							name: "name",
							description: "ชื่อของเพลย์ลิสต์",
						},
					},
					run: {
						deleted: ({ playlist }: { playlist: string }) =>
							`ลบเพลย์ลิสต์ \`${playlist}\` สำเร็จ`,
						error: "เกิดข้อผิดพลาดขณะลบเพลย์ลิสต์",
					},
				},
				list: {
					name: "list",
					description: "แสดงเพลย์ลิสต์ทั้งหมดของคุณ",
					run: {
						title: ({ author }: { author: string }) => `เพลย์ลิสต์ของ ${author}`,
						list: ({
							playlist,
							tracks,
						}: {
							playlist: string;
							tracks: number;
						}) => `${playlist} - ${tracks} เพลง`,
						no_playlists: "คุณไม่มีเพลย์ลิสต์",
						error: "เกิดข้อผิดพลาดขณะดึงข้อมูลเพลย์ลิสต์",
					},
				},
				load: {
					name: "load",
					description: "โหลดและเล่นเพลย์ลิสต์",
					options: {
						name: {
							name: "name",
							description: "ชื่อของเพลย์ลิสต์",
						},
					},
					run: {
						loaded: ({
							tracks,
							playlist,
						}: {
							tracks: number;
							playlist: string;
						}) => `โหลด **${tracks} เพลง** จากเพลย์ลิสต์ ${playlist}`,
						error: "เกิดข้อผิดพลาดขณะโหลดเพลย์ลิสต์",
					},
				},
				remove: {
					name: "remove",
					description: "ลบเพลงออกจากเพลย์ลิสต์",
					options: {
						name: {
							name: "name",
							description: "ชื่อของเพลย์ลิสต์",
						},
						track: {
							name: "track",
							description: "หมายเลขเพลงที่ต้องการลบ",
						},
					},
					run: {
						removed: ({ name }: { name: string }) =>
							`ลบเพลงออกจากเพลย์ลิสต์ ${name} สำเร็จ`,
						invalid: "หมายเลขเพลงไม่ถูกต้อง",
						error: "เกิดข้อผิดพลาดขณะลบเพลงออกจากเพลย์ลิสต์",
					},
				},
				view: {
					name: "view",
					description: "แสดงเพลงในเพลย์ลิสต์",
					options: {
						name: {
							name: "name",
							description: "ชื่อของเพลย์ลิสต์",
						},
					},
					run: {
						title: ({ name }: { name: string }) => `เพลย์ลิสต์: ${name}`,
						empty: "เพลย์ลิสต์นี้ว่างเปล่า",
						failed: "ไม่สามารถโหลดรายละเอียดเพลงได้",
						error: "เกิดข้อผิดพลาดขณะแสดงเพลย์ลิสต์",
					},
				},
			},
		},
		// Report Commands
		report: {
			name: "report",
			description: "รายงานข้อผิดพลาดหรือข้อเสนอแนะ",
			sub: {
				bug: {
					name: "bug",
					description: "รายงานข้อผิดพลาดที่คุณพบในบอท",
					run: {
						label: "รายงานข้อผิดพลาด",
						init_title: "รายงานข้อผิดพลาด",
						init_description: "คลิกที่ปุ่มด้านล่างเพื่อรายงานข้อผิดพลาดที่คุณพบในบอท",
						description: "อธิบายข้อผิดพลาดที่คุณพบ",
						description_placeholder:
							"เกิดอะไรขึ้น? คุณคาดหวังว่าจะเกิดอะไรขึ้น?\n\n**ตัวอย่าง:**\n\nเกิดข้อผิดพลาดเมื่อฉันพยายามเล่นเพลงจาก YouTube",
						steps: "ขั้นตอนในการทำซ้ำข้อผิดพลาด",
						steps_placeholder: "1. ขั้นตอนแรก\n2. ขั้นตอนที่สอง\n3. ขั้นตอนที่สาม...",
						success: "รายงานข้อผิดพลาดถูกส่งแล้ว",
						error: "เกิดข้อผิดพลาดขณะส่งรายงานข้อผิดพลาด",
						success_description: ({ reportId }: { reportId: string }) =>
							`รายงานข้อผิดพลาดของคุณถูกส่งแล้ว\n\n**หมายเลขรายงาน:** ${reportId}`,
						error_description:
							"เกิดข้อผิดพลาดขณะส่งรายงานข้อผิดพลาดของคุณ กรุณาลองอีกครั้งในภายหลัง",
						invalid_user: "เฉพาะผู้ใช้ที่เริ่มคำสั่งนี้เท่านั้นที่สามารถรายงานข้อผิดพลาดได้",
					},
				},
				suggestion: {
					name: "suggestion",
					description: "ให้ข้อเสนอแนะแก่บอท",
					run: {
						label: "ให้ข้อเสนอแนะแก่บอท",
						init_title: "ข้อเสนอแนะ",
						init_description: "คลิกที่ปุ่มด้านล่างเพื่อให้ข้อเสนอแนวที่คุณต้องการเห็นในบอท",
						description: "อธิบายข้อเสนอแนวที่คุณมี",
						description_placeholder: "คุณอยากเห็นอะไรเพิ่มเติมหรือปรับปรุงบ้าง?",
						steps: "ขั้นตอนในการทำซ้ำข้อผิดพลาด",
						steps_placeholder: "1. ขั้นตอนแรก\n2. ขั้นตอนที่สอง\n3. ขั้นตอนที่สาม...",
						success: "รายงานข้อเสนอแนถูกส่งแล้ว",
						error: "เกิดข้อผิดพลาดขณะส่งรายงานข้อเสนอแน",
						success_description: ({ reportId }: { reportId: string }) =>
							`ข้อเสนอแนของคุณถูกส่งแล้ว\n\n**หมายเลขรายงาน:** ${reportId}`,
						error_description:
							"เกิดข้อผิดพลาดขณะส่งข้อเสนอแนของคุณ กรุณาลองอีกครั้งในภายหลัง",
						invalid_user: "เฉพาะผู้ใช้ที่เริ่มคำสั่งนี้เท่านั้นที่สามารถให้ข้อเสนอแนได้",
					},
				},
			},
		},
	},
	// Events
	event: {
		setup: {
			title: "Soundy Music Player",
			description: "เข้าร่วมช่องเสียงและจัดคิวเพลงตามชื่อหรือ URL ในช่องนี้",
			no_voice: "คุณต้องอยู่ในช่องเสียงเพื่อใช้คำสั่งนี้!",
			no_connect: "ฉันต้องการสิทธิ์ `CONNECT` และ `SPEAK` ในช่องเสียงของคุณ!",
			failed: "ไม่สามารถเข้าร่วมช่องเสียงของคุณได้!",
			no_results: ({ query }: { query: string }) => `ไม่พบผลลัพธ์สำหรับ ${query}`,
			error: "เกิดข้อผิดพลาดขณะประมวลผลคำขอของคุณ!",
		},
		// Music Events
		music: {
			title: "ชื่อเพลง",
			artist: "ศิลปิน",
			duration: "ระยะเวลา",
			requested_by: "ร้องขอโดย",
			now_playing: "กำลังเล่นอยู่",
			node: "Node",
			finish_time: "เวลาที่เสร็จสิ้น",
			tracks: "เพลง",
			added: "เพิ่มลงในคิว",
			added_playlist: "เพิ่มเพลย์ลิสต์ลงในคิว",
			added_songs: ({ songs }: { songs: string }) => `${songs} เพลง`,
			no_results: "ไม่พบผลลัพธ์สำหรับคำค้นหาที่กำหนด.",
			pause: {
				title: "เพลงถูกหยุดชั่วคราว",
				description:
					"จังหวะถูกระงับอย่างอ่อนโยน!\nการเดินทางทางดนตรีของคุณอยู่ในช่วงพักผ่อนที่มีมนต์ขลัง.",
			},
			resume: {
				title: "เพลงถูกเล่นต่อ",
				description: "เพลงถูกเล่นต่อแล้ว!\nมาสนุกกันต่อเถอะ!",
			},
		},
		cooldown: ({ seconds }: { seconds: number }) =>
			`กรุณารอ ${seconds} วินาทีก่อนใช้คำสั่งนี้อีกครั้ง.`,
		// Manager
		manager: {
			no_nodes: "ไม่มี Node ที่พร้อมใช้งานในขณะนี้ กรุณาลองอีกครั้งในภายหลัง.",
			no_player: "ไม่มีผู้เล่นเพลงที่ใช้งานอยู่ในเซิร์ฟเวอร์นี้.",
			no_tracks: "ไม่มีเพลงในคิว.",
			not_enough: "ไม่มีเพลงในคิวเพียงพอที่จะดำเนินการตามคำสั่งนี้.",
		},
		// Premium
		premium: {
			limit_reached: {
				title: "คุณใช้คำสั่งฟรีทั้งหมดของคุณแล้ว!",
				description: ({ time }: { time: number }) =>
					`กรุณาโหวตให้ Soundy บน top.gg เพื่อรับ ${time} ชั่วโมงของการเข้าถึงแบบไม่จำกัด.`,
			},
			vote_now: "โหวตตอนนี้",
		},
		// Verifications
		verifications: {
			only_developer: "คำสั่งนี้ใช้ได้เฉพาะกับนักพัฒนาเท่านั้น.",
			only_guild_owner: "คำสั่งนี้ใช้ได้เฉพาะกับเจ้าของเซิร์ฟเวอร์เท่านั้น.",
		},
		// Voice
		voice: {
			no_same: ({ channel }: { channel: string }) =>
				`คุณต้องอยู่ในช่องเสียงเดียวกันกับฉันในห้อง ${channel}!`,
			no_vc: "คุณต้องอยู่ในช่องเสียงเพื่อใช้คำสั่งนี้!",
			no_perms: ({ channel }: { channel: string }) =>
				`ฉันไม่มีสิทธิ์ที่จำเป็นใน ${channel}!`,
			missing_perms: "ขาดสิทธิ์",
			failed: "ไม่สามารถเข้าร่วมช่องเสียงของคุณได้!",
		},
		// Listeners
		listeners: {
			no_members: "ไม่มีสมาชิกในช่องเสียง",
			disconnect: ({ time }: { time: string }) =>
				`ช่องว่าง! ตัวเล่นจะถูกตัดการเชื่อมต่อใน ${time}`,
			resume: "สมาชิกเข้าร่วม! กำลังเล่นต่อ",
		},
		// Mention
		mention: {
			title: "ยินดีต้อนรับสู่ Soundy!",
			description: {
				1: ({ prefix }: { prefix: string }) =>
					`ใช้ \`${prefix}help\` หรือ \`/help\` เพื่อค้นพบคำสั่งที่น่าทึ่งทั้งหมดของฉัน`,
				2: "ต้องการความช่วยเหลือ? เข้าร่วมเซิร์ฟเวอร์สนับสนุนของเราเพื่อขอความช่วยเหลือ",
				3: ({ prefix }: { prefix: string }) =>
					`ต้องการเริ่มต้นใช้งาน? เพียงพิมพ์ \`${prefix}play\` หรือ \`/play\` เพื่อเริ่มการเดินทางทางดนตรีของคุณ!`,
				4: "ฟีเจอร์:",
				5: "การสตรีมเพลงคุณภาพสูง",
				6: "การจัดการเพลย์ลิสต์ที่หลากหลาย",
				7: "รองรับหลายแพลตฟอร์ม",
			},
			footer: "เล่นเพลงคุณภาพสูงในเซิร์ฟเวอร์ Discord ของคุณฟรี",
			button: {
				add: "เพิ่มลงในเซิร์ฟเวอร์",
				support: "เซิร์ฟเวอร์สนับสนุน",
				vote: "โหวต",
			},
		},
		// Overrides
		overrides: {
			error: "เกิดข้อผิดพลาดขณะประมวลผลคำสั่งนี้",
			missing_perms: "ขาดสิทธิ์",
			missing_user_perms: "คุณไม่มีสิทธิ์ที่จำเป็นในการใช้คำสั่งนี้",
			missing_bot_perms: "ฉันไม่มีสิทธิ์ที่จำเป็นในการใช้คำสั่งนี้",
			invalid_command: {
				1: "การใช้งานคำสั่งไม่ถูกต้อง นี่คือวิธีการใช้งาน:",
				2: "ตัวเลือก:",
			},
		},
		// Paginator
		paginator: {
			only_author: "ขอโทษ, เฉพาะผู้เขียนคำสั่งเท่านั้นที่สามารถใช้เมนูนี้ได้.",
		},
	},
	// Components
	component: {
		// Clear Queue
		clear: {
			description: "Queue ถูกล้างแล้ว",
		},
		// Loop
		loop: {
			title: "โหมดลูปถูกอัปเดต",
			description: ({ mode }: { mode: string }) => `โหมดลูปถูกอัปเดตเป็น ${mode}`,
			select_title: "การเลือกโหมดลูป",
			select_description: "เลือกโหมดลูปเพื่อเปลี่ยน:",
			off: "ปิด",
			track: "เพลง",
			queue: "คิว",
			loop_off: "โหมดลูปถูกปิดใช้งานในขณะนี้",
			loop_track: "กำลังเล่นซ้ำเพลงปัจจุบัน",
			loop_queue: "กำลังเล่นซ้ำทั้งคิว",
		},
		// Previous
		previous: {
			title: "เล่นเพลงก่อนหน้า",
			description:
				"กำลังย้อนกลับการเดินทางทางดนตรีไปยังจุดเริ่มต้น!\nถึงเวลาที่จะสนุกไปกับเพลงสุดเจ๋งนี้อีกครั้ง!",
			no_previous: "ไม่มีเพลงก่อนหน้า",
			no_previous_description:
				"อุ้ย! ไม่มีเพลงก่อนหน้าให้เล่น!\nมาสนุกกับเพลงปัจจุบันกันเถอะ!",
		},
		// Queue
		queue: {
			name: "คิว",
			now_playing: "กำลังเล่น",
			total: ({ total }: { total: number }) => `จำนวนเพลงทั้งหมด: ${total}`,
			track: ({ track, author }: { track: string; author: string }) =>
				`${track} โดย ${author}`,
			requested_by: ({ user }: { user: string }) => `ร้องขอโดย ${user}`,
			up_next: "ถัดไป",
			unknown_artist: "ศิลปินที่ไม่รู้จัก",
		},
		// Shuffle
		shuffle: {
			description: "คิวถูกสุ่มใหม่แล้ว!\nมาสนุกกับการผสมเพลงใหม่กันเถอะ!",
		},
		skip: {
			title: "ข้าม",
			description: "ข้ามไปยังเพลงถัดไปในคิว",
			autoplay: "ข้ามไปยังเพลงแนะนำสุดเจ๋ง",
			end: "จบแล้ว! ตอนนี้เรามาถึงจุดสิ้นสุดของการเดินทางทางดนตรีแล้ว\nถึงเวลาเริ่มต้นใหม่กับเพลงใหม่ๆ!",
		},
		stop: {
			title: "หยุดแล้ว",
			description:
				"งานเลี้ยงเสร็จสิ้นแล้ว! ฉันได้ล้างคิวและเก็บลำโพงเรียบร้อยแล้ว\nพร้อมเมื่อไหร่ก็เริ่มการผจญภัยทางดนตรีใหม่ได้เลย!",
		},
		// Volume
		volume: {
			title: "ตั้งค่าเสียง",
			description: ({ volume }: { volume: string }) =>
				`ระดับเสียงถูกตั้งค่าเป็น ${volume}`,
		},

		// Node Select
		nodeSelect: {
			title: ({ node }: { node: string }) => `ข้อมูล Node - ${node}`,
			status: ({ status }: { status: string }) => `สถานะ: ${status}`,
			connected: "เชื่อมต่อ",
			disconnected: "ไม่เชื่อมต่อ",
			description: "เลือก Node เพื่อดูข้อมูลรายละเอียด",
			players: ({ players }: { players: number }) => `ผู้เล่น: ${players}`,
			playing_players: ({ playingPlayers }: { playingPlayers: number }) =>
				`ตัวเล่นที่กำลังเล่น: ${playingPlayers}`,
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
			no_node: "Node นี้ไม่มีอีกต่อไป",
		},
	},
	// Middleware
	middlewares: {
		cooldown: {
			description: ({ seconds }: { seconds: number }) =>
				`โปรดรอ ${seconds} วินาทีก่อนใช้คำสั่งนี้อีกครั้ง.`,
		},
	},
	// Autocomplete
	autocomplete: {
		music: {
			no_nodes: "ไม่มี Node ที่พร้อมใช้งาน",
			no_voice: "ไม่มีช่องเสียง",
			no_tracks: "ไม่พบเพลง",
		},
	},
};
