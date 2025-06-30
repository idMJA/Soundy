-- Migration to remove guildId column from playlist table
-- SQLite doesn't support DROP COLUMN directly, so we need to recreate the table

-- Create new playlist table without guildId
CREATE TABLE playlist_new (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Copy data from old table to new table (excluding guildId)
INSERT INTO playlist_new (id, user_id, name, created_at)
SELECT id, user_id, name, created_at FROM playlist;

-- Drop old table
DROP TABLE playlist;

-- Rename new table to original name
ALTER TABLE playlist_new RENAME TO playlist;

-- Recreate the unique constraint
CREATE UNIQUE INDEX playlist_user_name_unique ON playlist(user_id, name);
