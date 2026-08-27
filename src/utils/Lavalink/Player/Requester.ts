export interface SafeRequester {
	id: string;
	username?: string;
	avatar?: string;
}

/**
 * Transforms any requester object into a clean, safe representation without leaking
 * client instances, tokens, circular structures, cache, or translation dictionaries into Lavalink userData.
 */
export function transformRequester(requester: unknown): SafeRequester | null {
	if (!requester) return null;

	let req: unknown = requester;

	// Handle nested structures like { requester: { requester: ... } }
	while (
		req &&
		typeof req === "object" &&
		"requester" in req &&
		(req as Record<string, unknown>).requester &&
		typeof (req as Record<string, unknown>).requester === "object"
	) {
		req = (req as Record<string, unknown>).requester;
	}

	if (typeof req === "string") {
		return { id: req };
	}

	if (typeof req === "object" && req !== null) {
		const reqObj = req as Record<string, unknown>;
		const id = reqObj.id ? String(reqObj.id) : undefined;
		if (!id) return null;

		const username =
			typeof reqObj.username === "string"
				? reqObj.username
				: typeof reqObj.tag === "string"
					? reqObj.tag
					: typeof reqObj.displayName === "string"
						? reqObj.displayName
						: undefined;

		let avatar: string | undefined;
		if (typeof reqObj.avatar === "string") {
			avatar = reqObj.avatar;
		} else if (typeof reqObj.avatarURL === "function") {
			try {
				avatar = (reqObj.avatarURL as () => string)();
			} catch {
				// ignore
			}
		}

		return {
			id,
			...(username ? { username } : {}),
			...(avatar ? { avatar } : {}),
		};
	}

	return null;
}
