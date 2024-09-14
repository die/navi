const axios = require('axios');
const db = require('../lib/db');
const { execSync } = require('node:child_process');


class OsuAPI {

	#baseUrl;

	constructor() {
		this.#baseUrl = 'https://osu.ppy.sh/api/v2';
		this.modes = {
			'osu!catch': 'fruits',
			'osu!mania': 'mania',
			'osu!standard': 'osu',
			'osu!taiko': 'taiko',
		};
	}

	async getPlayer(user, mode) {
		const config = await this.#getConfig('get', this.#baseUrl + `/users/${user}/${mode ?? 'osu'}`, true);
		try {
			const response = await axios.request(config).catch((error) => console.log(error));
			const id = response.data.id;
			const username = response.data.username;
			await db.execute(`INSERT INTO osu_ids (id, username) VALUES (?, ?) ON DUPLICATE KEY UPDATE username = ?`, [id, username, username]);
			return response.data;
		}
		catch (err) {
			return null;
		}
	}

	async getRecentScore(user, mode) {
		const config = await this.#getConfig('get', this.#baseUrl + `/users/${user}/scores/recent?include_fails=1&mode=${mode}`, true);
		try {
			const response = await axios.request(config);
			return response.data;
		}
		catch {
			return null;
		}
	}

	async getBestScores(user, mode) {
		const config = await this.#getConfig('get', this.#baseUrl + `/users/${user}/scores/best?limit=100&mode=${mode}`, true);
		try {
			const response = await axios.request(config);
			return response.data;
		}
		catch {
			return null;
		}
	}

	async getBeatmap(beatmap) {
		const config = await this.#getConfig('get', this.#baseUrl + `/beatmaps/${beatmap}`, true);
		try {
			const response = await axios.request(config);
			return response.data;
		}
		catch (err) {
			return null;
		}
	}

	async #getConfig(method, url, requireToken, data) {
		const config = {};
		config.maxBodyLength = Infinity;
		config.method = method;
		config.url = url;
		config.headers = {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
		};
		const bodyData = data ? data : {};
		config.data = JSON.stringify(bodyData);
		if (requireToken) {
			const access_token = await this.#getAccessToken();
			config.headers['Authorization'] = `Bearer ${access_token}`;
		}
		return config;
	}

	async #getAccessToken() {
		const [rows, fields] = await db.execute('SELECT access_token, refresh_token, expiry, created_at FROM api_tokens WHERE token_id = ?', ['osu']);

        const access_token = rows[0]['access_token']
        const refresh_token = rows[0]['refresh_token']
        const expiry = rows[0]['expiry']
        const created_at = rows[0]['created_at']

        const timeTimestamp = Math.floor(new Date(created_at).getTime() / 1000);
        const nowTimestamp = Math.floor(Date.now() / 1000);

        if ((timeTimestamp + expiry) < nowTimestamp) {
            let data = JSON.stringify({
                "client_id": process.env.OSU_CLIENT_ID,
                "client_secret": process.env.OSU_TOKEN,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token"
            });

            let config = {
                method: 'post',
                maxBodyLength: Infinity,
                url: 'https://osu.ppy.sh/oauth/token',
                headers: { 
                    'Accept': 'application/json',
			        'Content-Type': 'application/json',
                },
                data : data
            };

            const response = await axios.request(config);

            const new_access_token = response.data.access_token;
            const new_refresh_token = response.data.refresh_token;
            const new_expiry = response.data.expires_in;
            await db.execute('UPDATE api_tokens SET access_token = ?, refresh_token = ?, expiry = ?, created_at = NOW() WHERE token_id = ?', [new_access_token, new_refresh_token, new_expiry, 'osu']);
            return new_access_token;
        }
        return access_token;
	}

	#simulate(cmd) {
		const simulate = execSync(cmd).toString().match(/{.*}/s);
		const data = JSON.parse(simulate);
		return data;
	}

	simulate(mode, options) {
		switch (mode) {
		case 'osu':
			return this.simulateOsu(options);
		case 'mania':
			return this.simulateMania(options);
		case 'taiko':
			return this.simulateTaiko(options);
		case 'catch':
			return this.simulateCatch(options);
		}
	}

	simulateOsu(options) {
		const accuracy = options.accuracy ? `-a ${options.accuracy}` : '';
		const combo = options.combo ? `-c ${options.combo}` : '';
		const percent_combo = options.percent_combo ? `-C ${options.percent_combo}` : '';
		const mods = options.mods ? options.mods.map(mod => `-m ${mod}`).join(' ') : '';
		const misses = options.misses ? `-X ${options.misses}` : '';
		const mehs = options.mehs ? `-M ${options.mehs}` : '';
		const goods = options.goods ? `-G ${options.goods}` : '';
		const nc = options.nc ? '-nc' : '';
		const beatmapId = options.beatmapId;
		const cmd = `cd osu-performance-calculator && dotnet PerformanceCalculator.dll simulate osu ${accuracy} ${combo} ${percent_combo} ${mods} ${misses} ${mehs} ${goods} ${nc} -j ${beatmapId}`;
		return this.#simulate(cmd);
	}

	simulateMania(options) {
		const mods = options.mods ? options.mods.map(mod => `-m ${mod}`).join(' ') : '';
		const score = options.score ? `-s ${options.score}` : '';
		const nc = options.nc ? 'nc' : '';
		const beatmapId = options.beatmapId;
		const cmd = `cd osu-performance-calculator && dotnet PerformanceCalculator.dll simulate mania ${mods} ${score} ${nc} -j ${beatmapId}`;
		return this.#simulate(cmd);
	}

	simulateTaiko(options) {
		const accuracy = options.accuracy ? `-a ${options.accuracy}` : '';
		const combo = options.combo ? `-c ${options.combo}` : '';
		const percent_combo = options.percent_combo ? `-C ${options.percent_combo}` : '';
		const mods = options.mods ? options.mods.map(mod => `-m ${mod}`).join(' ') : '';
		const misses = options.misses ? `-X ${options.misses}` : '';
		const goods = options.goods ? `-G ${options.goods}` : '';
		const nc = options.nc ? '-nc' : '';
		const beatmapId = options.beatmapId;
		const cmd = `cd osu-performance-calculator && dotnet PerformanceCalculator.dll simulate taiko ${accuracy} ${combo} ${percent_combo} ${mods} ${misses} ${goods} ${nc} -j ${beatmapId}`;
		return this.#simulate(cmd);
	}

	simulateCatch(options) {
		const accuracy = options.accuracy ? `-a ${options.accuracy}` : '';
		const combo = options.combo ? `-c ${options.combo}` : '';
		const percent_combo = options.percent_combo ? `-C ${options.percent_combo}` : '';
		const mods = options.mods ? options.mods.map(mod => `-m ${mod}`).join(' ') : '';
		const misses = options.misses ? `-X ${options.misses}` : '';
		const tinyDroplets = options.tinyDroplets ? `-T ${options.tinyDroplets}` : '';
		const droplets = options.droplets ? `-D ${options.droplets}` : '';
		const nc = options.nc ? '-nc' : '';
		const beatmapId = options.beatmapId;
		const cmd = `cd osu-performance-calculator && dotnet PerformanceCalculator.dll simulate catch ${accuracy} ${combo} ${percent_combo} ${mods} ${misses} ${tinyDroplets} ${droplets} ${nc} -j ${beatmapId}`;
		return this.#simulate(cmd);
	}
}

class GameMode {
	static fruits = 'osu!catch';
	static mania = 'osu!mania';
	static osu = 'osu!standard';
	static taiko = 'osu!taiko';

	static displayGameMode(mode) {
		const split = GameMode[mode].split('osu!')[1];
		return `osu! ${split.charAt(0).toUpperCase() + split.slice(1)}`;
	}

	static getGameModesAsChoices() {
		return Object.keys(GameMode).map(mode => ({ name: GameMode[mode], value: mode }));
	}

	static getSimulateName(mode) {
		switch (mode) {
		case 'fruits':
			return 'catch';
		case 'mania':
			return 'mania';
		case 'osu':
			return 'osu';
		case 'taiko':
			return 'taiko';
		}
	}
}

const osuAPI = new OsuAPI();

module.exports = { osuAPI, GameMode };