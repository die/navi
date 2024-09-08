const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { osuAPI, GameMode } = require('../../lib/osu');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('osu')
		.setDescription('Get information on an osu player')
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
		.setDMPermission(false),

	async execute(interaction, db, emojis) {
		let username = interaction.options.getString('username');
		const mode = interaction.options.getString('mode');
		if (!username) {
            const [rows, fields] = await db.execute('SELECT osu_username FROM users WHERE id = ?', [interaction.user.id]);
		 	if (rows[0]) username = rows[0]['osu_username'];
		}
		if (!username) return interaction.reply({ content: `Failed to find username, got \`${username}\``, ephemeral: true });
		await interaction.deferReply();
		const player = await osuAPI.getPlayer(username, mode);
		const joinDate = new Date(player.join_date).toLocaleString('en-US', { year: 'numeric', month: 'long', day: '2-digit', hour: 'numeric', minute: 'numeric' });
		const peakTime = `<t:${Math.floor(new Date(player.rank_highest.updated_at).getTime() / 1000)}:R>`;
		const playstyles = player.playstyle ? player.playstyle.map(p => `\`${p}\``).join(', ') : '`N/A`';
        const ranking_xh_emoji = emojis.find(emoji => emoji.name == 'ranking_XH');
        const ranking_x_emoji = emojis.find(emoji => emoji.name == 'ranking_X');
        const ranking_sh_emoji = emojis.find(emoji => emoji.name == 'ranking_SH');
        const ranking_s_emoji = emojis.find(emoji => emoji.name == 'ranking_S');
        const ranking_a_emoji = emojis.find(emoji => emoji.name == 'ranking_A');

        const ranking_xh = `<:${ranking_xh_emoji.name}:${ranking_xh_emoji.id}>`;
        const ranking_x = `<:${ranking_x_emoji.name}:${ranking_x_emoji.id}>`;
        const ranking_sh = `<:${ranking_sh_emoji.name}:${ranking_sh_emoji.id}>`;
        const ranking_s = `<:${ranking_s_emoji.name}:${ranking_s_emoji.id}>`;
        const ranking_a = `<:${ranking_a_emoji.name}:${ranking_a_emoji.id}>`;

		const grades = `${ranking_xh} \`${player.statistics.grade_counts.ssh}\` ${ranking_x} \`${player.statistics.grade_counts.ss}\` ${ranking_sh} \`${player.statistics.grade_counts.sh}\` ${ranking_s} \`${player.statistics.grade_counts.s}\` ${ranking_a} \`${player.statistics.grade_counts.a}\``;
		const embed = new EmbedBuilder()
			.setAuthor({ name: `${player.username}'s ${GameMode.displayGameMode(mode)} Profile`, url: `https://osu.ppy.sh/users/${player.id}`, iconURL: `${player.avatar_url}` })
			.addFields(
				{ name: 'Performace', value: `Rank \`#${player.statistics.global_rank}\` (:flag_${player.country_code.toLowerCase()}: \`#${player.statistics.country_rank})\` \n Peaked: \`#${player.rank_highest.rank}\` ${peakTime} \n PP: \`${player.statistics.pp}\` \n Accuracy: \`${player.statistics.hit_accuracy.toFixed(2)}%\` \n Level: \`${player.statistics.level.current}\` + \`${player.statistics.level.progress}%\` \n Play Count: \`${player.statistics.play_count}\`\nTotal Score: \`${player.statistics.total_score}\` \n ${grades}`, inline: false },
				{ name: 'Previous Usernames', value: `${player.previous_usernames.map(u => `\`${u}\``).join(', ')}`, inline: false },
				{ name: 'Social', value: `Followers: \`${player.follower_count}\``, inline: false },
				{ name: 'Misc.', value: `Plays with ${playstyles}`, inline: false },
			)
			.setThumbnail(`${player.avatar_url}`)
			.setImage(`${player.cover_url}`)
			.setFooter({ text: `Joined osu! on ${joinDate}` });
		await interaction.editReply({ embeds: [embed] });
	},
};