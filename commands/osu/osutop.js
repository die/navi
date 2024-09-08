const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { osuAPI, GameMode } = require('../../lib/osu');
const { GeneratePagination } = require('../../util');

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('osutop')
		.setDescription('Get an osu player\'s best plays')
		.addStringOption(option =>
			option.setName('mode')
				.setDescription('The gamemode for the player')
				.setRequired(true)
				.addChoices(...GameMode.getGameModesAsChoices()))
		.addStringOption(option =>
			option
				.setName('username')
				.setDescription('The username/id of the osu player')
				.setRequired(false))
		.addStringOption(option =>
			option.setName('sort')
				.setDescription('The methods to sort the list of best plays')
				.setRequired(false)
				.addChoices(
					{ name: 'oldest', value: 'oldest' },
					{ name: 'newest', value: 'newest' },
					{ name: 'highest accuracy', value: 'highacc' },
					{ name: 'lowest accuracy', value: 'lowacc' },
				))
		.setDMPermission(false),

	async execute(interaction, db, emojis) {
		let username = interaction.options.getString('username');
        if (!username) {
            const [rows, fields] = await db.execute('SELECT osu_username FROM users WHERE id = ?', [interaction.user.id]);
		 	if (rows[0]) username = rows[0]['osu_username'];
		}
		if (!username) return interaction.reply({ content: `Failed to find username, got \`${username}\``, ephemeral: true });

		let playerId;
		// if an id isnt provided
		if (!username.match(/^\d+$/)) {
            const [rows, fields] = await db.execute('SELECT id FROM osu_ids WHERE username = ?', [username]);
			playerId = rows.length === 0 ? (await osuAPI.getPlayer(username, 'osu'))?.id : rows[0]['id'];
		}
		if (!playerId) return interaction.reply(`Failed to find player id for ${username}`);

		const mode = interaction.options.getString('mode');
		const bestScores = await osuAPI.getBestScores(playerId, mode);
		if (!bestScores || bestScores.length == 0) return await interaction.reply(`Failed to find best scores for ${playerId}`);

		const sort = interaction.options.getString('sort');
		const sorted = [...bestScores];
		switch (sort) {
		case 'oldest':
			sorted.sort((a, b) => {
				const dateA = new Date(a.created_at);
				const dateB = new Date(b.created_at);
				if (dateA.getTime() < dateB.getTime()) return -1;
				if (dateA.getTime() > dateB.getTime()) return 1;
				return 0;
			});
			break;
		case 'newest':
			sorted.sort((a, b) => {
				const dateA = new Date(a.created_at);
				const dateB = new Date(b.created_at);
				if (dateA.getTime() < dateB.getTime()) return 1;
				if (dateA.getTime() > dateB.getTime()) return -1;
				return 0;
			});
			break;
		case 'highacc':
			sorted.sort((a, b) => {
				const accA = a.accuracy;
				const accB = b.accuracy;
				if (accA < accB) return 1;
				if (accA > accB) return -1;
				return 0;
			});
			break;
		case 'lowacc':
			sorted.sort((a, b) => {
				const accA = a.accuracy;
				const accB = b.accuracy;
				if (accB < accA) return 1;
				if (accB > accA) return -1;
				return 0;
			});
		}

		const firstScore = bestScores[0];
		await interaction.deferReply();
		const embed = new EmbedBuilder()
			.setAuthor({ name: `Best Plays for ${firstScore.user.username}`, iconURL: `${firstScore.user.avatar_url}`, url: `https://osu.ppy.sh/users/${firstScore.user.id}` })
			.setThumbnail(`${firstScore.user.avatar_url}`)
			.setTimestamp();

		async function generateFunction(e, currentPage, length) {
			const pageScores = sorted.slice(currentPage * length, currentPage * length + length);
			const description = pageScores.map((score) => {
				const mods = score.mods;
				// const simulateMode = GameMode.getSimulateName(mode);
				const options = {
					mods: score.mods,
					score: score.score,
					misses: score.statistics.count_miss,
					goods: score.statistics.count_100,
					mehs: score.statistics.count_50,
					beatmapId: score.beatmap.id,
				};
				const simulation = osuAPI.simulate(mode, options);
                const rankEmoji = emojis.find(emoji => emoji.name == `ranking_${score.rank}`);

				const header = `**${bestScores.indexOf(score) + 1}) [${score.beatmapset.title} [${score.beatmap.version}]](${score.beatmap.url}) ${mods.length == 0 ? '' : `+${score.mods.join('')}`}** [${simulation.difficulty_attributes.star_rating.toFixed(2)}★]`;
				const ifFc = score.statistics.count_miss == 0 ? '' : `*(${simulation.performance_attributes.pp.toFixed(2)} pp for ${simulation.score.accuracy.toFixed(2)}% FC)*`;
				const performance = `<:${rankEmoji.name}:${rankEmoji.id}> • **${score.pp.toFixed(2)}pp** ${ifFc} • ${(score.accuracy * 100).toFixed(2)}%`;
				const playData = `${score.score.toLocaleString()} • x${score.max_combo}/${simulation.difficulty_attributes.max_combo} • [${score.statistics.count_300}/${score.statistics.count_100}/${score.statistics.count_50}/${score.statistics.count_miss}]`;
				const date = `*Play set <t:${Math.floor(new Date(score.created_at).getTime() / 1000)}:R>* • [Replay](https://osu.ppy.sh/scores/osu/${score.id}/download)`;
				return `${header}\n${performance}\n${playData}\n${date}`;
			}).join('\n');
			e.setDescription(description);
			e.setFooter({ text: `Page ${currentPage + 1}/${Math.floor(bestScores.length / length)}` });
			return e;
		}

        await GeneratePagination(interaction, embed, 5, bestScores.length, generateFunction);
	},
};