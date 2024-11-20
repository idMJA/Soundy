const mongoose = require('mongoose');

const setupSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    channelId: { type: String, required: true },
    messageId: { type: String, required: true }
});

module.exports = mongoose.model('Setup', setupSchema); 