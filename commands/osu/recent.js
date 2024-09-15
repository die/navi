const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { osuAPI, GameMode } = require('../../lib/osu');
const { execSync } = require('node:child_process');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('recent')
        .setDescription("Get an osu player's recent play")
        .addStringOption((option) =>
            option
                .setName('mode')
                .setDescription('The gamemode for the player')
                .setRequired(true)
                .addChoices(...GameMode.getGameModesAsChoices())
        )
        .addStringOption((option) =>
            option
                .setName('username')
                .setDescription('The username/id of the osu player')
                .setRequired(false)
        )
        .setDMPermission(false),

    async execute(interaction, db, emojis) {
        let username = interaction.options.getString('username');
        if (!username) {
            const [rows] = await db.execute(
                'SELECT osu_username FROM users WHERE id = ?',
                [interaction.user.id]
            );
            if (rows[0]) username = rows[0]['osu_username'];
        }
        if (!username)
            return interaction.reply({
                content: `Failed to find username, got \`${username}\``,
                ephemeral: true,
            });

        let playerId;
        // if an id isnt provided
        if (!username.match(/^\d+$/)) {
            const [rows] = await db.execute(
                'SELECT id FROM osu_ids WHERE username = ?',
                [username]
            );
            playerId =
                rows.length === 0
                    ? (await osuAPI.getPlayer(username, 'osu'))?.id
                    : rows[0]['id'];
        }
        if (!playerId)
            return interaction.reply(
                `Failed to find player id for ${username}`
            );

        const mode = interaction.options.getString('mode');
        const recentScores = await osuAPI.getRecentScore(playerId, mode);
        if (recentScores.length == 0)
            return interaction.reply(`No recents for ${username}`);

        await interaction.deferReply();
        const recentScore = recentScores[0];
        const beatmapId = recentScore.beatmap.id;
        const mods = recentScore.mods.map((mod) => `-m ${mod}`).join(' ');
        const combo = recentScore.max_combo;
        const goods = recentScore.statistics.count_100;
        const mehs = recentScore.statistics.count_50;
        const misses = recentScore.statistics.count_miss;
        const result = JSON.parse(
            (
                await execSync(
                    `cd osu-performance-calculator && dotnet PerformanceCalculator.dll simulate osu ${mods} -c ${combo} -X ${misses} -G ${goods} -M ${mehs} -j ${beatmapId}`
                )
            )
                .toString()
                .match(/{.*}/s)
        );
        const fcResult = JSON.parse(
            (
                await execSync(
                    `cd osu-performance-calculator && dotnet PerformanceCalculator.dll simulate osu ${mods} -c ${result.difficulty_attributes.max_combo} -G ${goods} -M ${mehs} -j ${beatmapId}`
                )
            )
                .toString()
                .match(/{.*}/s)
        );
        const progress = (
            ((recentScore.statistics.count_300 +
                recentScore.statistics.count_100 +
                recentScore.statistics.count_50 +
                recentScore.statistics.count_miss) /
                (recentScore.beatmap.count_circles +
                    recentScore.beatmap.count_sliders +
                    recentScore.beatmap.count_spinners)) *
            100
        ).toFixed(2);
        let tries = 0;
        for (const score of recentScores) {
            if (score.beatmap.id === beatmapId) tries++;
        }
        let total_length = recentScore.beatmap.total_length;
        let bpm = recentScore.beatmap.bpm;
        let cs = recentScore.beatmap.cs;
        const ar = result.difficulty_attributes.approach_rate;
        const od = result.difficulty_attributes.overall_difficulty;
        let hp = recentScore.beatmap.drain;
        if (
            recentScore.mods.includes('DT') ||
            recentScore.mods.includes('NC')
        ) {
            total_length = total_length / 1.5;
            bpm = bpm * 1.5;
        }

        if (recentScore.mods.includes('HR')) {
            cs = cs * 1.3;
            hp = hp * 1.4;
        }

        if (recentScore.mods.includes('EZ')) {
            cs = cs / 2;
            hp = hp / 2;
        }

        if (recentScore.mods.includes('HT')) {
            bpm = bpm / 1.75;
            total_length = total_length * 1.33;
        }

        const length = new Date(total_length * 1000)
            .toISOString()
            .slice(14, 19);
        const playedOn = new Date(recentScore.created_at).toLocaleString(
            'en-US',
            {
                year: 'numeric',
                month: 'long',
                day: '2-digit',
                hour: 'numeric',
                minute: 'numeric',
            }
        );
        const rankEmoji = emojis.find(
            (emoji) => emoji.name == `ranking_${recentScore.rank}`
        );

        const embed = new EmbedBuilder()
            .setAuthor({
                name: `Recent play for ${recentScore.user.username}`,
                iconURL: recentScore.user.avatar_url,
                url: `https://osu.ppy.sh/users/${playerId}`,
            })
            .setTitle(
                `${recentScore.beatmapset.artist} - ${recentScore.beatmapset.title} [${recentScore.beatmap.version}]`
            )
            .setURL(`${recentScore.beatmap.url}`)
            .addFields(
                {
                    name: 'Play Statistics',
                    value: `<:${rankEmoji.name}:${rankEmoji.id}> (${progress}%) +${mods.length === 0 ? 'No Mod' : recentScore.mods.toString().replaceAll(',', '')} • **${result.performance_attributes.pp.toFixed(2)}pp** (${fcResult.performance_attributes.pp.toFixed(2)} pp for ${fcResult.score.accuracy.toFixed(2)}% FC) \n Try #${tries} • ${recentScore.score} • ${(recentScore.accuracy * 100).toFixed(2)}% • x${recentScore.max_combo}/${result.difficulty_attributes.max_combo} • [${recentScore.statistics.count_300}/${recentScore.statistics.count_100}/${recentScore.statistics.count_50}/${recentScore.statistics.count_miss}]`,
                    inline: false,
                },
                {
                    name: 'Beatmap Statistics',
                    value: `**Length:** \`${length}\` • **BPM:** \`${bpm}\` • **Objects:** \`${recentScore.beatmap.count_circles + recentScore.beatmap.count_sliders + recentScore.beatmap.count_spinners}\`\n**CS:** \`${cs.toFixed(2)}\` • **AR:** \`${ar.toFixed(2)}\` • **OD:** \`${od.toFixed(2)}\` • **HP:** \`${hp.toFixed(2)}\` • **SR:** \`${result.difficulty_attributes.star_rating.toFixed(2)}★\``,
                    inline: false,
                }
            )
            .setImage(recentScore.beatmapset.covers['cover@2x'])
            .setFooter({ text: `Played on ${playedOn}` })
            .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
    },
};
