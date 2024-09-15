const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const os = require('os');
const { startTime } = require('../../events/ready.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sysinfo')
        .setDescription('Get system information')
        .setDMPermission(false),

    async execute(interaction) {
        const client = interaction.client;
        const user = client.user;
        const avatar = user.displayAvatarURL({ dynamic: true });
        const timestamp = `<t:${Math.floor(startTime / 1000)}>`;
        const team =
            client.application.owner ||
            (await interaction.client.application.fetch()).owner;
        const owner = client.users.cache.get(team.ownerId);
        const uptimeInSeconds = os.uptime();
        const days = Math.floor(uptimeInSeconds / (24 * 60 * 60));
        const hours = Math.floor(
            (uptimeInSeconds % (24 * 60 * 60)) / (60 * 60)
        );
        const minutes = Math.floor((uptimeInSeconds % (60 * 60)) / 60);
        const seconds = Math.floor(uptimeInSeconds % 60);
        const system_uptime = `System Uptime: ${days}d ${hours}h ${minutes}m ${seconds}s`;
        const total_memory = (os.totalmem() / 1024 ** 3).toFixed(2);
        const free_memory = (os.freemem() / 1024 ** 3).toFixed(2);
        const platform = `Platform: ${os.platform()} ${os.arch()}`;
        const heartbeat = `Heartbeat: ${interaction.client.ws.ping} ms`;
        const memory = `Memory: ${free_memory} / ${total_memory} GB`;
        const process_memory = `Process Usage: ${(process.memoryUsage().rss / 1024 ** 2).toFixed(2)} MB`;
        const sysinfo = `${heartbeat}\n${platform}\n${system_uptime}\n${memory}\n${process_memory}`;

        const embed = new EmbedBuilder()
            .setAuthor({ name: user.tag, iconURL: avatar })
            .setDescription(`Started on ${timestamp}`)
            .setThumbnail(avatar)
            .addFields({ name: 'System Information', value: `${sysinfo}` })
            .setFooter({
                text: `Owned by ${owner.globalName} \`${owner.username}\``,
                iconURL: owner.displayAvatarURL({ dynamic: true }),
            })
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
    },
};
