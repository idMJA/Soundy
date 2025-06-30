# Playlist API Examples (No Guild ID Required)

The playlist system has been updated to remove the guild ID requirement. Playlists are now purely user-based and can be created and managed from any server or context.

## API Endpoints

### Create a Playlist
```bash
curl -X POST http://localhost:3000/api/playlist/create \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "123456789012345678",
    "name": "My Favorite Songs"
  }'
```

### Add Tracks to Playlist
```bash
curl -X POST http://localhost:3000/api/playlist/add \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "123456789012345678",
    "playlist": "My Favorite Songs",
    "tracks": [
      {
        "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "info": {
          "identifier": "dQw4w9WgXcQ",
          "author": "Rick Astley",
          "length": 212000,
          "isStream": false,
          "title": "Rick Astley - Never Gonna Give You Up",
          "uri": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          "artworkUrl": "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
          "isrc": "GBARL9300135"
        }
      }
    ]
  }'
```

### List User's Playlists
```bash
curl http://localhost:3000/api/playlist/list/123456789012345678
```

### View Playlist
```bash
curl "http://localhost:3000/api/playlist/view/123456789012345678/My%20Favorite%20Songs"
```

### View Playlist by ID
```bash
curl http://localhost:3000/api/playlist/viewById/550e8400-e29b-41d4-a716-446655440000
```

### Remove Track from Playlist
```bash
curl -X POST http://localhost:3000/api/playlist/remove \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "123456789012345678",
    "playlist": "My Favorite Songs",
    "trackUri": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  }'
```

### Delete Playlist
```bash
curl -X POST http://localhost:3000/api/playlist/delete \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "123456789012345678",
    "name": "My Favorite Songs"
  }'
```

## Database Schema Changes

The `playlist` table schema has been updated:

**Before:**
```sql
CREATE TABLE playlist (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    guild_id TEXT,  -- This has been removed
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

**After:**
```sql
CREATE TABLE playlist (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

## Migration

To apply the schema changes to an existing database, run:

```bash
node migrate-remove-guild-id.mjs
```

This will:
1. Create a new playlist table without the guildId column
2. Copy all existing data (excluding guildId)
3. Replace the old table with the new one
4. Recreate the unique constraint on (user_id, name)

## Discord Command Changes

The `/playlist create` command no longer requires being used in a specific server. Users can create playlists from any server where the bot is present, and the playlists will be accessible from any server.

**Before:** Playlists were tied to specific servers
**After:** Playlists are user-global and accessible from any server
