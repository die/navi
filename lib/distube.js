const { DisTube } = require('distube');
const { SpotifyPlugin } = require("@distube/spotify");
const { YouTubePlugin } = require("@distube/youtube");
const { YtDlpPlugin } = require('@distube/yt-dlp');
const { EmbedBuilder, Colors } = require('discord.js');


let distube;

function getDistube(client) {
    if (!distube) {
        distube = new DisTube(client, {
            emitNewSongOnly: true,
            plugins: [
                new SpotifyPlugin(),
                new YouTubePlugin(),
                new YtDlpPlugin()
            ],
        });

        distube
            .on('playSong', (queue, song) => {
                const embed = new EmbedBuilder()
                    .setDescription(`**Now Playing:** [${song.name}](${song.url})`)
                    .setFooter({ text: `Requested by ${song.member.user.username}`, iconURL: `${song.member.displayAvatarURL({ dynamic: true })}`})
			        .setTimestamp()
                queue.textChannel.send({ embeds: [embed] });
            })
            .on('addSong', (queue, song) => {
                const embed = new EmbedBuilder()
                    .setDescription(`Added [${song.name}](${song.url}) to the queue`)
                    .setFooter({ text: `Requested by ${song.member.user.username}`, iconURL: `${song.member.displayAvatarURL({ dynamic: true })}`})
			        .setTimestamp()
                queue.textChannel.send({ embeds: [embed] });
            })
            .on('error', (error) => {
                const embed = new EmbedBuilder()
                    .setColor(Colors.Red)
                    .setDescription(`Error in player, printing logs.`)
                    .setTimestamp()
                console.error('DisTube error:', error);
            })
            .on('empty', (queue) => {
                queue.textChannel.send('The voice channel is empty. Leaving...');
            });
    }
    return distube;
}

function generateEmbed() {
    const embed = new EmbedBuilder()
			.setImage(avatar)
			.setTimestamp();
}

module.exports = getDistube;
