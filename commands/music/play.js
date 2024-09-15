const { SlashCommandBuilder } = require('discord.js');
const getDistube = require('../../lib/distube');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Search and play a song')
        .addStringOption((option) =>
            option
                .setName('query')
                .setDescription('Search keywords or URL')
                .setRequired(true)
        ),

    async execute(interaction) {
        const query = interaction.options.getString('query');
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            return interaction.reply(
                'You need to be in a voice channel to play music!'
            );
        }

        try {
            await interaction.deferReply();
            const distube = getDistube(interaction.client);
            distube.play(voiceChannel, query, {
                member: interaction.member,
                textChannel: interaction.channel,
            });
            interaction.followUp(`Searching for \`${query}\``);
        } catch (error) {
            console.error(error);
            interaction.followUp(
                'An error occurred while trying to play the song.'
            );
        }
    },
};
