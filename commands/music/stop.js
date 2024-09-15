const { SlashCommandBuilder } = require('discord.js');
const getDistube = require('../../lib/distube');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stop')
		.setDescription('Stop the music and clear the queue'),

	async execute(interaction) {
		const voiceChannel = interaction.member.voice.channel;

		if (!voiceChannel) {
			return interaction.reply(
				'You need to be in a voice channel to stop music!',
			);
		}

		try {
			await interaction.deferReply();
			const distube = getDistube(interaction.client);
			distube.stop(voiceChannel);
			interaction.followUp('Stopped and cleared the queue.');
		} catch (error) {
			console.error(error);
			interaction.followUp('An error occurred while stopping.');
		}
	},
};
