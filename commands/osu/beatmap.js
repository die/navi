const {
	SlashCommandBuilder,
	EmbedBuilder,
	AttachmentBuilder,
} = require('discord.js');
const { osuAPI } = require('../../lib/osu');

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('beatmap')
		.setDescription('Get an osu beatmap')
		.addStringOption((option) =>
			option
				.setName('id')
				.setDescription('The id of the osu beatmap')
				.setRequired(true),
		)
		.setDMPermission(false),

	async execute(interaction) {
		const id = interaction.options.getString('id');
		const beatmap = await osuAPI.getBeatmap(id);
		if (!beatmap) {
			return interaction.reply(`Failed to find beatmap \`${id}\``);
		}
		const mapper = await osuAPI.getPlayer(beatmap.user_id);
		if (!mapper) {
			return interaction.reply(
				`Couldn't find the mapper \`${beatmap.user_id}\``,
			);
		}

		await interaction.deferReply();

		const mp3 = new AttachmentBuilder(
			`https:${beatmap.beatmapset.preview_url}`,
		);
		const length = new Date(beatmap.total_length * 1000)
			.toISOString()
			.slice(14, 19);
		const submittedDate = new Date(
			beatmap.beatmapset.submitted_date,
		).toLocaleString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
		const updatedDate = new Date(beatmap.last_updated).toLocaleString(
			'en-US',
			{
				year: 'numeric',
				month: 'long',
				day: 'numeric',
			},
		);

		const embed = new EmbedBuilder()
			.setAuthor({
				name: `Mapped by ${mapper.username}`,
				url: `https://osu.ppy.sh/users/${mapper.id}`,
				iconURL: `${mapper.avatar_url}`,
			})
			.setTitle(
				`${beatmap.beatmapset.artist} - ${beatmap.beatmapset.title} [${beatmap.version}]`,
			)
			.setURL(`${beatmap.url}`)
			.setImage(`${beatmap.beatmapset.covers.cover}`)
			.addFields(
				{
					name: 'Metadata',
					value: `Status: \`${beatmap.status.charAt(0).toUpperCase() + beatmap.status.slice(1)}\`\nMode: \`${beatmap.mode}\`\nFavorites: \`${beatmap.beatmapset.favourite_count}\`\n Play Count: \`${beatmap.playcount}\`\nPasses: \`${beatmap.passcount}\``,
					inline: false,
				},
				{
					name: 'Statistics',
					value: `Length: \`${length}\` • BPM: \`${beatmap.bpm}\` • Objects: \`${beatmap.count_circles + beatmap.count_sliders + beatmap.count_spinners}\` • Max Combo: \`${beatmap.max_combo}\`\nCS: \`${beatmap.cs}\` • AR: \`${beatmap.ar}\` • OD: \`${beatmap.accuracy}\` • HP: \`${beatmap.drain}\` • SR: \`${beatmap.difficulty_rating}★\``,
					inline: false,
				},
				{
					name: 'Tags',
					value: `${
						beatmap.beatmapset.tags.length
							? beatmap.beatmapset.tags
									.split(' ')
									.map((topic) => `\`${topic}\``)
									.join(', ')
							: 'N/A'
					}`,
					inline: false,
				},
			)
			.setFooter({
				text: `Submitted on ${submittedDate} • Last updated on ${updatedDate}`,
			});

		await interaction.editReply({ embeds: [embed], files: [mp3] });
	},
};
