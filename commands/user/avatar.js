const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { osuClient, osuCode, osuToken } = require('../../config.json');
const axios = require('axios');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('avatar')
		.setDescription('Get a user\'s avatar')
		.addUserOption(option =>
			option
				.setName('user')
				.setDescription('The user you want the avatar of')
				.setRequired(false))
		.setDMPermission(false),

	async execute(interaction, db) {
		const user = interaction.options.getUser('user') ?? interaction.user;
		const avatar = user.displayAvatarURL({ dynamic: true, size: 2048 });

		const embed = new EmbedBuilder()
			.setAuthor({ name: user.tag, iconURL: avatar })
			.setImage(avatar)
			.setTimestamp();
		await interaction.reply({ embeds: [embed] });
	},
};