const { REST } = require("@discordjs/rest");
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');
const ascii = require("ascii-table");
const { color, getTimestamp } = require('../utils/loggingEffects.js');

const table = new ascii().setHeading("File Name", "Status");

module.exports = (client) => {
    client.handleCommands = async (commandFolders, path) => {
        client.commandArray = [];
        for (folder of commandFolders) {
            const commandFiles = fs.readdirSync(`${path}/${folder}`).filter(file => file.endsWith('.js'));
            for (const file of commandFiles) {
                const command = require(`../commands/${folder}/${file}`);
                
                if (client.commands.has(command.data.name)) {
                    client.logs.warn(`[COMMANDS] Duplicate command found: ${command.data.name}. Skipping...`);
                    table.addRow(file, "Skipped (Duplicate)");
                    continue;
                }
                
                client.commands.set(command.data.name, command);
                client.commandArray.push(command.data.toJSON());

                if (command.name) {
                    client.commands.set(command.name, command);
                    table.addRow(file, "Loaded");
            
                    if (command.aliases && Array.isArray(command.aliases)) {
                        command.aliases.forEach((alias) => {
                            client.aliases.set(alias, command.name);
                        });
                    }
                } else {
                    table.addRow(file, "Loaded");
                    continue;
                }
            }
        }

        client.logs.info(`[COMMANDS] Loaded ${client.commands.size} SlashCommands.`);

        const rest = new REST({
            version: '9'
        }).setToken(process.env.TOKEN);

        (async () => {
            try {
                client.logs.info(`[SLASH_COMMANDS] Started refreshing application (/) commands.`);

                await rest.put(
                    Routes.applicationCommands(process.env.CLIENT_ID), {
                        body: client.commandArray
                    },
                ).catch((error) => {
                    console.error(`${color.red}[${getTimestamp()}] [SLASH_COMMANDS] Error while refreshing application (/) commands. \n${color.red}[${getTimestamp()}] [SLASH_COMMANDS] Check if your clientID is correct and matches your bots token:`, error);
                });

                client.logs.success(`[SLASH_COMMANDS] Successfully reloaded application (/) commands.`);
            } catch (error) {
                console.error(error);
            }
        })();
    };
};