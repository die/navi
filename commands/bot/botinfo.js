const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { startTime } = require('../../events/ready.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('botinfo')
		.setDescription('Get the bot\'s info')
		.setDMPermission(false),

	async execute(interaction, db) {
		const client = interaction.client;
		const user = client.user;
		const avatar = user.displayAvatarURL({ dynamic: true });
		const timestamp = `<t:${Math.floor(startTime / 1000)}>`;
		const owner = client.application.owner || (await interaction.client.application.fetch()).owner;

		const sortedCommands = client.commands.sort((a, b) => a.data.name.localeCompare(b.data.name));
		const sortedGuilds = client.guilds.cache.sort((a, b) => a.name.localeCompare(b.name));
		const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${interaction.client.application.id}&permissions=0&scope=bot%20applications.commands`;

		const embed = new EmbedBuilder()
			.setAuthor({ name: user.tag, iconURL: avatar, url: inviteUrl })
			.setDescription(`Started on ${timestamp}`)
			.setThumbnail(avatar)
			.addFields(
				{ name: 'Status:', value:  `Heartbeat: ${interaction.client.ws.ping} ms` },
				{ name: `Commands: ${client.commands.size}`, value:  `${sortedCommands.map(command => `\`${command.data.name}\``)}` },
				{ name: `Guilds: ${client.guilds.cache.size}`, value: `${sortedGuilds.map(guild => `\`${guild.name}\``)}` },
			)
			.setFooter({ text: `Owned by ${owner.globalName} \`${owner.username}\``, iconURL: owner.displayAvatarURL({ dynamic: true }) })
			.setTimestamp();
		await interaction.reply({ embeds: [embed] });
	},
};