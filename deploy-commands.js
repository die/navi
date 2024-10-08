const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

const commands = [];
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs
		.readdirSync(commandsPath)
		.filter((file) => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			commands.push(command.data.toJSON());
		} else {
			console.log(
				`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
			);
		}
	}
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

const guildIds = [
	// my server
	'654478709029339137',
	// trevor's server
	'926335148650283029',
	// drew's server
	'937021368493547580',
];

(async () => {
	try {
		console.log(
			`Started refreshing ${commands.length} application (/) commands.`,
		);
		for (const guildId of guildIds) {
			await rest.put(
				Routes.applicationGuildCommands(
					process.env.DISCORD_CLIENT_ID,
					guildId,
				),
				{ body: commands },
			);
			console.log(`Successfully reloaded commands for guild ${guildId}.`);
		}
	} catch (error) {
		console.error(error);
	}
})();
