import { createCanvas, type Image, loadImage } from "@napi-rs/canvas";

export interface ProfileCardData {
	user: {
		id: string;
		username: string;
		displayName: string;
		avatarUrl: string;
	};
	totalSongs: number;
	songRank: number;
	totalTimeMs: number;
	timeRank: number;
	totalVotes: number;
	isPremium: boolean;
	topServers: Array<{
		name: string;
		iconUrl?: string | null;
		playCount: number;
	}>;
	topFriends: Array<{
		username: string;
		avatarUrl?: string | null;
		timeMs: number;
		listenCount: number;
	}>;
	topTracks: Array<{
		title: string;
		author: string;
		artwork?: string | null;
		length?: number | null;
		playCount: number;
	}>;
}

function formatDuration(ms: number): string {
	if (!ms || ms <= 0) return "0m";
	const totalMinutes = Math.floor(ms / 60000);
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;
	return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function truncateText(text: string, maxLength: number): string {
	if (!text) return "";
	if (text.length <= maxLength) return text;
	return `${text.slice(0, maxLength - 1)}…`;
}

async function safeLoadImage(
	url: string | null | undefined,
): Promise<Image | null> {
	if (!url) return null;
	try {
		return await loadImage(url);
	} catch {
		return null;
	}
}

export async function generateProfileCard(
	data: ProfileCardData,
): Promise<Buffer> {
	const width = 1050;
	const height = 580;
	const canvas = createCanvas(width, height);
	const ctx = canvas.getContext("2d");

	const bgGradient = ctx.createLinearGradient(0, 0, width, height);
	bgGradient.addColorStop(0, "#080a0c");
	bgGradient.addColorStop(0.5, "#0d1115");
	bgGradient.addColorStop(1, "#090d0b");
	ctx.fillStyle = bgGradient;
	ctx.fillRect(0, 0, width, height);

	ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
	for (let x = 20; x < width - 20; x += 24) {
		for (let y = 20; y < height - 20; y += 24) {
			ctx.beginPath();
			ctx.arc(x, y, 0.8, 0, Math.PI * 2);
			ctx.fill();
		}
	}

	ctx.strokeStyle = "rgba(34, 197, 94, 0.05)";
	ctx.lineWidth = 1.5;
	ctx.beginPath();
	for (let x = 0; x <= width; x += 15) {
		const y = 250 + Math.sin(x * 0.007) * 35 + Math.cos(x * 0.014) * 18;
		if (x === 0) ctx.moveTo(x, y);
		else ctx.lineTo(x, y);
	}
	ctx.stroke();

	const glow1 = ctx.createRadialGradient(160, 110, 10, 160, 110, 320);
	glow1.addColorStop(0, "rgba(34, 197, 94, 0.08)");
	glow1.addColorStop(1, "rgba(34, 197, 94, 0)");
	ctx.fillStyle = glow1;
	ctx.fillRect(0, 0, width, height);

	ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
	ctx.lineWidth = 1;
	ctx.beginPath();
	ctx.roundRect(10, 10, width - 20, height - 20, 4);
	ctx.stroke();

	ctx.fillStyle = "rgba(18, 24, 20, 0.85)";
	ctx.beginPath();
	ctx.roundRect(880, 28, 125, 30, 2);
	ctx.fill();
	ctx.strokeStyle = "rgba(34, 197, 94, 0.25)";
	ctx.lineWidth = 1;
	ctx.stroke();

	ctx.fillStyle = "#22c55e";
	ctx.fillRect(880, 28, 3, 30);

	ctx.font = "bold 12px 'Hack', 'DejaVu Sans Mono', monospace";
	ctx.fillStyle = "#f8fafc";
	ctx.fillText("SOUNDY", 916, 48);

	const avatarX = 45;
	const avatarY = 32;
	const avatarSize = 82;

	ctx.save();
	ctx.beginPath();
	ctx.roundRect(avatarX, avatarY, avatarSize, avatarSize, 8);
	ctx.closePath();
	ctx.clip();

	const userAvatar = await safeLoadImage(data.user.avatarUrl);
	if (userAvatar) {
		ctx.drawImage(userAvatar, avatarX, avatarY, avatarSize, avatarSize);
	} else {
		ctx.fillStyle = "#1e293b";
		ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
	}
	ctx.restore();

	ctx.strokeStyle = "#22c55e";
	ctx.lineWidth = 1.5;
	ctx.beginPath();
	ctx.roundRect(avatarX, avatarY, avatarSize, avatarSize, 8);
	ctx.stroke();

	ctx.font = "bold 23px 'Open Sans', 'DejaVu Sans', sans-serif";
	ctx.fillStyle = "#ffffff";
	ctx.fillText(truncateText(data.user.displayName, 24), 145, 62);

	ctx.font = "14px 'Hack', 'DejaVu Sans Mono', monospace";
	ctx.fillStyle = "#64748b";
	ctx.fillText(`@${truncateText(data.user.username, 24)}`, 145, 84);

	ctx.font = "bold 12px 'Hack', 'DejaVu Sans Mono', monospace";
	ctx.fillStyle = "#4ade80";
	ctx.fillText(`LISTENING TIME: ${formatDuration(data.totalTimeMs)}`, 145, 107);

	const badgeY = 135;
	const badgeH = 62;
	const badgeW = 305;
	const badgeGap = 22;
	const startX = 45;

	const badges = [
		{
			title: `#${data.songRank} SONGS STREAMED`,
			sub: `${data.totalSongs} songs played`,
		},
		{
			title: `#${data.timeRank} TRACK TIME`,
			sub: "Top listening duration",
		},
		{
			title: data.isPremium ? "★ PREMIUM VIP" : "GLOBAL VOTES",
			sub: data.isPremium
				? "Active Supporter"
				: `${data.totalVotes} total votes`,
		},
	];

	for (let i = 0; i < badges.length; i++) {
		const b = badges[i];
		if (!b) continue;
		const bx = startX + i * (badgeW + badgeGap);

		ctx.fillStyle = "rgba(16, 22, 19, 0.75)";
		ctx.beginPath();
		ctx.roundRect(bx, badgeY, badgeW, badgeH, 3);
		ctx.fill();
		ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
		ctx.lineWidth = 1;
		ctx.stroke();

		ctx.fillStyle = "#22c55e";
		ctx.fillRect(bx, badgeY, 3, badgeH);

		ctx.font = "bold 12px 'Hack', 'DejaVu Sans Mono', monospace";
		ctx.fillStyle = "#4ade80";
		ctx.fillText(b.title, bx + 16, badgeY + 26);

		ctx.font = "12px 'Open Sans', 'DejaVu Sans', sans-serif";
		ctx.fillStyle = "#94a3b8";
		ctx.fillText(b.sub, bx + 16, badgeY + 47);
	}

	const panelY = 216;
	const panelH = 330;
	const panelW = 305;

	const drawPanelContainer = (x: number, title: string) => {
		ctx.fillStyle = "rgba(14, 19, 16, 0.75)";
		ctx.beginPath();
		ctx.roundRect(x, panelY, panelW, panelH, 3);
		ctx.fill();
		ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
		ctx.lineWidth = 1;
		ctx.stroke();

		ctx.font = "bold 11px 'Hack', 'DejaVu Sans Mono', monospace";
		ctx.fillStyle = "#4ade80";
		ctx.fillText(title, x + 16, panelY + 26);

		ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(x + 16, panelY + 36);
		ctx.lineTo(x + panelW - 16, panelY + 36);
		ctx.stroke();
	};

	const p1X = startX;
	drawPanelContainer(p1X, "TOP SERVERS");

	if (data.topServers.length === 0) {
		ctx.font = "13px 'Open Sans', 'DejaVu Sans', sans-serif";
		ctx.fillStyle = "#64748b";
		ctx.fillText("No server activity yet", p1X + 16, panelY + 75);
	} else {
		for (let i = 0; i < data.topServers.length; i++) {
			const s = data.topServers[i];
			if (!s) continue;
			const itemY = panelY + 54 + i * 86;
			const iconSize = 48;
			const iconX = p1X + 16;

			const serverImg = await safeLoadImage(s.iconUrl);
			ctx.save();
			ctx.beginPath();
			ctx.roundRect(iconX, itemY, iconSize, iconSize, 4);
			ctx.clip();
			if (serverImg) {
				ctx.drawImage(serverImg, iconX, itemY, iconSize, iconSize);
			} else {
				ctx.fillStyle = "#1e293b";
				ctx.fillRect(iconX, itemY, iconSize, iconSize);
				ctx.fillStyle = "#4ade80";
				ctx.font = "bold 15px 'Hack', 'DejaVu Sans Mono', monospace";
				ctx.fillText(
					s.name.slice(0, 1).toUpperCase() || "#",
					iconX + 18,
					itemY + 30,
				);
			}
			ctx.restore();

			ctx.font = "bold 13px 'Open Sans', 'DejaVu Sans', sans-serif";
			ctx.fillStyle = "#f1f5f9";
			ctx.fillText(truncateText(s.name, 19), iconX + 60, itemY + 22);

			ctx.font = "12px 'Open Sans', 'DejaVu Sans', sans-serif";
			ctx.fillStyle = "#64748b";
			ctx.fillText(`${s.playCount} songs played`, iconX + 60, itemY + 41);
		}
	}

	const p2X = startX + panelW + badgeGap;
	drawPanelContainer(p2X, "TOP FRIENDS");

	if (data.topFriends.length === 0) {
		const itemY = panelY + 54;
		const iconSize = 48;
		const iconX = p2X + 16;

		ctx.fillStyle = "#1e293b";
		ctx.beginPath();
		ctx.roundRect(iconX, itemY, iconSize, iconSize, 4);
		ctx.fill();

		ctx.strokeStyle = "#4ade80";
		ctx.lineWidth = 2;
		ctx.lineCap = "round";

		ctx.beginPath();
		ctx.arc(iconX + 24, itemY + 24, 12, Math.PI, 0);
		ctx.stroke();

		ctx.fillStyle = "#4ade80";
		ctx.beginPath();
		ctx.roundRect(iconX + 9, itemY + 22, 5, 12, 1);
		ctx.roundRect(iconX + 34, itemY + 22, 5, 12, 1);
		ctx.fill();

		ctx.font = "bold 13px 'Open Sans', 'DejaVu Sans', sans-serif";
		ctx.fillStyle = "#f1f5f9";
		ctx.fillText("Solo Listener", iconX + 60, itemY + 22);

		ctx.font = "12px 'Open Sans', 'DejaVu Sans', sans-serif";
		ctx.fillStyle = "#64748b";
		ctx.fillText("Listens alone in voice", iconX + 60, itemY + 41);
	} else {
		for (let i = 0; i < data.topFriends.length; i++) {
			const f = data.topFriends[i];
			if (!f) continue;
			const itemY = panelY + 54 + i * 86;
			const iconSize = 48;
			const iconX = p2X + 16;

			const friendImg = await safeLoadImage(f.avatarUrl);
			ctx.save();
			ctx.beginPath();
			ctx.roundRect(iconX, itemY, iconSize, iconSize, 4);
			ctx.clip();
			if (friendImg) {
				ctx.drawImage(friendImg, iconX, itemY, iconSize, iconSize);
			} else {
				ctx.fillStyle = "#1e293b";
				ctx.fillRect(iconX, itemY, iconSize, iconSize);
			}
			ctx.restore();

			ctx.font = "bold 13px 'Open Sans', 'DejaVu Sans', sans-serif";
			ctx.fillStyle = "#f1f5f9";
			ctx.fillText(truncateText(f.username, 19), iconX + 60, itemY + 22);

			ctx.font = "12px 'Open Sans', 'DejaVu Sans', sans-serif";
			ctx.fillStyle = "#64748b";
			ctx.fillText(
				`${formatDuration(f.timeMs)} (${f.listenCount} songs)`,
				iconX + 60,
				itemY + 41,
			);
		}
	}

	const p3X = startX + (panelW + badgeGap) * 2;
	drawPanelContainer(p3X, "TOP TRACKS");

	if (data.topTracks.length === 0) {
		ctx.font = "13px 'Open Sans', 'DejaVu Sans', sans-serif";
		ctx.fillStyle = "#64748b";
		ctx.fillText("No tracks recorded yet", p3X + 16, panelY + 75);
	} else {
		for (let i = 0; i < data.topTracks.length; i++) {
			const t = data.topTracks[i];
			if (!t) continue;
			const itemY = panelY + 54 + i * 86;
			const iconSize = 48;
			const iconX = p3X + 16;

			const trackImg = await safeLoadImage(t.artwork);
			ctx.save();
			ctx.beginPath();
			ctx.roundRect(iconX, itemY, iconSize, iconSize, 4);
			ctx.clip();
			if (trackImg) {
				ctx.drawImage(trackImg, iconX, itemY, iconSize, iconSize);
			} else {
				ctx.fillStyle = "#1e293b";
				ctx.fillRect(iconX, itemY, iconSize, iconSize);
				ctx.fillStyle = "#4ade80";
				ctx.font = "bold 16px 'Open Sans', 'DejaVu Sans', sans-serif";
				ctx.fillText("♪", iconX + 18, itemY + 30);
			}
			ctx.restore();

			ctx.font = "bold 13px 'Open Sans', 'DejaVu Sans', sans-serif";
			ctx.fillStyle = "#f1f5f9";
			ctx.fillText(truncateText(t.title, 22), iconX + 58, itemY + 20);

			ctx.font = "11px 'Open Sans', 'DejaVu Sans', sans-serif";
			ctx.fillStyle = "#94a3b8";
			ctx.fillText(truncateText(t.author, 24), iconX + 58, itemY + 36);

			ctx.font = "11px 'Open Sans', 'DejaVu Sans', sans-serif";
			ctx.fillStyle = "#64748b";
			const trackDuration = t.length ? formatDuration(t.length) : "";
			ctx.fillText(
				`${t.playCount} plays${trackDuration ? ` • ${trackDuration}` : ""}`,
				iconX + 58,
				itemY + 50,
			);
		}
	}

	return canvas.toBuffer("image/png");
}
