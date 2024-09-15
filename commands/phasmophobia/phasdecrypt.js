const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const crypto = require('crypto');
const { xp } = require('../../data/phasxp.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('phasdecrypt')
		.setDescription(
			'Decypt a Phasmophobia save file often located at %appdata%\\LocalLow\\Kinetic Games\\Phasmophobia',
		)
		.addAttachmentOption((option) =>
			option
				.setName('savefile')
				.setDescription('The ecrypted SaveFile.txt')
				.setRequired(true),
		)
		.setDMPermission(false),

	async execute(interaction) {
		const attachment = interaction.options.getAttachment('savefile');
		const response = await fetch(attachment.attachment).catch((err) => {
			return interaction.reply(err);
		});
		const buffer = new Uint8Array(await response.arrayBuffer());
		const iv = buffer.slice(0, 16);
		const key = crypto.pbkdf2Sync('t36gref9u84y7f43g', iv, 100, 16, 'sha1');
		const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
		const finalBuffer = Buffer.concat([
			decipher.update(buffer.slice(16)),
			decipher.final(),
		]);
		const json = JSON.parse(
			finalBuffer.toString().replace(/(\d+):(\d+)/g, '"$1":"$2"'),
		);
		await interaction.deferReply();

		// const timeSpent = Object.keys(json).filter(k => k.startsWith('timeSpent'));
		// const timeStats = timeSpent.map(k => {
		// 	return `${k
		// 		.split(/_|(?=[A-Z])/)
		// 		.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		// 		.join(' ')}: \`${displaySecondsAsHours(json[k].value)}\``;
		// }).join('\n');

		// const gameStats = {
		// 	'Identified': `${json['ghostsIdentifiedAmount'].value.toLocaleString()}`,
		// 	'Misidentified': `${json['ghostsMisidentifiedAmount'].value.toLocaleString()}`,
		// 	'Objectives Completed': `${json['objectivesCompleted'].value.toLocaleString()}`,
		// 	'Photos Taken': `${json['photosTaken'].value.toLocaleString()}`,
		// 	'Bones Collected': `${json['amountOfBonesCollected'].value.toLocaleString()}`,
		// 	'Cursed Possessions Used': `${json['amountOfCursedPossessionsUsed'].value.toLocaleString()}`,
		// 	'Money Spent': `$${json['moneySpent'].value.toLocaleString()}`,
		// 	'Money Earned': `$${json['moneyEarned'].value.toLocaleString()}`,
		// 	'Deaths': `${json['diedAmount'].value.toLocaleString()}`,
		// 	'Items Lost': `${json['itemsLost'].value.toLocaleString()}`,
		// 	'Items Bought': `${json['itemsBought'].value.toLocaleString()}`,
		// };

		const newLevel = json['NewLevel'].value;
		const experience = json['Experience'].value;
		let xpUntilPrestige = -1 * experience;
		for (let i = newLevel - 1; i < xp.length; i++) {
			xpUntilPrestige += xp[i].value;
		}

		const labels = ['Level Stats', 'Game Stats', 'Time Stats'];

		const xpUntilLevelUp =
			xp[newLevel - 1].value - json['Experience'].value;
		const levelStats = {
			Prestige: `${json['Prestige'].value.toLocaleString()}`,
			Level: `${newLevel.toLocaleString()}`,
			'Legacy Level': `${json['Level'].value.toLocaleString()}`,
			Experience: `${experience.toLocaleString()} / ${(xpUntilLevelUp + experience).toLocaleString()}`,
			'XP For Level Up': `${xpUntilLevelUp.toLocaleString()}`,
			'Next Unlock': `${xp[newLevel].unlock == '' ? 'None' : xp[newLevel].unlock}`,
			'XP Needed To Prestige': `${xpUntilPrestige.toLocaleString()}`,
		};

		const levelEmbed = new EmbedBuilder()
			.setAuthor({
				name: `${interaction.user.username}'s Phasmophobia Stats`,
				iconURL: `${interaction.user.displayAvatarURL({ dynamic: true })}`,
			})
			.setThumbnail(
				`${interaction.user.displayAvatarURL({ dynamic: true })}`,
			)
			.addFields(
				{
					name: 'Ghost Type',
					value: `${json['GhostType'].value}`,
					inline: false,
				},
				{
					name: labels[0],
					value: `${Object.keys(levelStats)
						.map((k) => `${k}: \`${levelStats[k]}\``)
						.join('\n')}`,
					inline: false,
				},
			)
			.setTimestamp();

		// const gameEmbed = new EmbedBuilder()
		// 	.setAuthor({ name: `${interaction.user.username}'s Phasmophobia Stats`, iconURL: `${interaction.user.displayAvatarURL({ dynamic: true })}` })
		// 	.setThumbnail(`${interaction.user.displayAvatarURL({ dynamic: true })}`)
		// 	.addFields({ name: labels[1], value: `${Object.keys(gameStats).map(k => `${k}: \`${gameStats[k]}\``).join('\n')}` })
		// 	.setTimestamp();

		// const timeEmbed = new EmbedBuilder()
		// 	.setAuthor({ name: `${interaction.user.username}'s Phasmophobia Stats`, iconURL: `${interaction.user.displayAvatarURL({ dynamic: true })}` })
		// 	.setThumbnail(`${interaction.user.displayAvatarURL({ dynamic: true })}`)
		// 	.addFields({ name: labels[2], value: `${timeStats}` })
		// 	.setTimestamp();

		await interaction.editReply({ embeds: [levelEmbed] });
	},
};
