const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
    userId: { 
        type: String, 
        required: true 
    },
    name: { 
        type: String, 
        required: true 
    },
    songs: [{ 
        type: String 
    }],
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

playlistSchema.index({ userId: 1, name: 1 }, { unique: true });

// Export as lowercase 'playlist'
module.exports = mongoose.models.playlist || mongoose.model('playlist', playlistSchema);
