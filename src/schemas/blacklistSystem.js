const mongoose = require('mongoose');

const blacklistSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    reason: { type: String, required: true },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Blacklist', blacklistSchema);
