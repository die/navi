const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const getDistube = require('../../lib/distube');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Get the current queue'),

    async execute(interaction) {
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            return interaction.reply(
                'You need to be in a voice channel to stop music!'
            );
        }

        try {
            const distube = getDistube(interaction.client);
            const queue = distube.getQueue(interaction.guild.id);

            if (!queue || queue.songs.length === 0) {
                return interaction.reply(
                    'There is no music currently playing.'
                );
            }

            const songList = queue.songs
                .map(
                    (song, index) =>
                        `${index + 1}. [${song.name}](${song.url}) - ${song.formattedDuration}`
                )
                .join('\n');

            const embed = new EmbedBuilder()
                .setTitle('Queue')
                .setDescription(`${songList}`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Queue command error:', error);
            interaction.reply(
                'An error occurred while trying to fetch the queue.'
            );
        }
    },
};
