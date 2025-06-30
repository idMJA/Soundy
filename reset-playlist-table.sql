-- Drop the existing playlist table
DROP TABLE IF EXISTS playlist;

-- Recreate playlist table with correct constraints
CREATE TABLE playlist (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    created_at TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
    UNIQUE(user_id, name)
);
