const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('avatar')
		.setDescription("Get a user's avatar")
		.addUserOption((option) =>
			option
				.setName('user')
				.setDescription('The user you want the avatar of')
				.setRequired(false),
		)
		.setDMPermission(false),

	async execute(interaction) {
		const user = interaction.options.getUser('user') ?? interaction.user;
		const avatar = user.displayAvatarURL({ dynamic: true, size: 2048 });

		const embed = new EmbedBuilder()
			.setAuthor({ name: user.tag, iconURL: avatar })
			.setImage(avatar)
			.setTimestamp();
		await interaction.reply({ embeds: [embed] });
	},
};
