const { Events } = require('discord.js');

module.exports = {
	name: Events.ClientReady,
	once: true,
	startTime: Date.now(),
	async execute(client) {
        client.application_emojis = await client.application.emojis.fetch();
        console.log(`Ready! Logged in as ${client.user.tag}`);
	},
};