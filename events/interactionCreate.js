const { Events, Collection } = require('discord.js');
const db = require('../lib/db');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (!interaction.isChatInputCommand()) return;

		const command = interaction.client.commands.get(
			interaction.commandName,
		);

		if (!command) {
			console.error(
				`No command matching ${interaction.commandName} was found.`,
			);
			return;
		}

		if (
			command.ownerOnly &&
			interaction.user.id !== process.env.DISCORD_OWNER_ID
		) {
			return interaction.reply({
				content:
					"You don't have permission for this owner-only command.",
				ephemeral: true,
			});
		}

		const { cooldowns } = interaction.client;

		if (!cooldowns.has(command.data.name)) {
			cooldowns.set(command.data.name, new Collection());
		}

		const now = Date.now();
		const timestamps = cooldowns.get(command.data.name);
		const defaultCooldownDuration = 0;
		const cooldownAmount =
			(command.cooldown ?? defaultCooldownDuration) * 1000;
		if (timestamps.has(interaction.user.id)) {
			const expirationTime =
				timestamps.get(interaction.user.id) + cooldownAmount;
			if (now < expirationTime) {
				const expiredTimestamp = Math.round(expirationTime / 1000);
				return interaction.reply({
					content: `Please wait, you are on a cooldown for \`${command.data.name}\`. You can use it again <t:${expiredTimestamp}:R>.`,
					ephemeral: true,
				});
			}
		}

		timestamps.set(interaction.user.id, now);
		setTimeout(
			() => timestamps.delete(interaction.user.id),
			cooldownAmount,
		);

		try {
			await command.execute(
				interaction,
				db,
				interaction.client.application_emojis,
			);
		} catch (error) {
			console.error(`Error executing ${interaction.commandName}`);
			console.error(error);
		}
	},
};
