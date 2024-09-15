const {
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
} = require('discord.js');

async function GeneratePagination(
    message,
    embed,
    maxPerPage,
    length,
    generateFunction
) {
    let currentPage = 0;

    const pageOptions = [...Array(Math.floor(length / maxPerPage)).keys()].map(
        (page) => {
            return new StringSelectMenuOptionBuilder()
                .setLabel(`Page ${page + 1}`)
                .setValue(`${page}`);
        }
    );

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('page')
        .setPlaceholder('Select a page')
        .addOptions(pageOptions);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const messageOptions = {
        embeds: [await generateFunction(embed, currentPage, maxPerPage)],
        components: [row],
        fetchReply: true,
    };
    let msg;
    if (message.deferred) {
        msg = await message.editReply(messageOptions);
    } else {
        msg = await message.reply(messageOptions);
    }

    const filter = (interaction) => {
        return interaction.customId === 'page';
    };

    const collector = msg.createMessageComponentCollector({
        filter,
        time: 60000,
    });

    collector.on('collect', async (interaction) => {
        if (interaction.customId === 'page') {
            currentPage = parseInt(interaction.values[0]);
        }

        row.components[0].setDisabled(true);
        await msg.edit({ components: [row] });
        await interaction.deferUpdate();
        const generatedEmbed = await generateFunction(
            embed,
            currentPage,
            maxPerPage
        );
        messageOptions.embeds = [generatedEmbed];
        row.components[0].setDisabled(false);
        msg.edit(messageOptions);
    });

    collector.on('end', () => {
        msg.edit({ components: [] });
    });
}

module.exports = { GeneratePagination };
