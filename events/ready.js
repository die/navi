const { Events, ActivityType } = require('discord.js');
const getDisTube = require('../lib/distube');

module.exports = {
	name: Events.ClientReady,
	once: true,
	startTime: Date.now(),
	async execute(client) {
		client.application_emojis = await client.application.emojis.fetch();

		getDisTube(client);

		client.user.setActivity({
			name: 'the wired',
			type: ActivityType.Streaming,
			url: 'https://www.youtube.com/watch?v=Hi2OSnyERq0',
		});

		console.log(`Ready! Logged in as ${client.user.tag}`);
	},
};
