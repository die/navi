const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('osuset')
		.setDescription(
			'Set your osu username to be used by default in other commands',
		)
		.addStringOption((option) =>
			option
				.setName('username')
				.setDescription('The username for your osu account')
				.setRequired(true),
		)
		.setDMPermission(false),

	async execute(interaction, db) {
		const username = interaction.options.getString('username');
		if (!username) return;
		await db.execute(
			'INSERT INTO users (id, osu_username) VALUES (?, ?) ON DUPLICATE KEY UPDATE osu_username = ?',
			[interaction.user.id, username, username],
		);
		return interaction.reply({
			content: `Updated your osu username to \`${username}\``,
			ephemeral: true,
		});
	},
};
