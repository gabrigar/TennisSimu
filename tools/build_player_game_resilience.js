const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const PLAYERS_PATH = path.join(ROOT, 'js', 'players_v3.js');
const RESULTS_PLAYERS_PATH = path.join(ROOT, 'js', 'results_extra_players.js');
const OUTPUT_PATH = path.join(ROOT, 'js', 'player_game_resilience.js');

function loadVar(filePath, expression) {
  const context = { console, window: {} };
  context.globalThis = context;
  const code = fs.readFileSync(filePath, 'utf8') + `\n;globalThis.__OUT__ = ${expression};`;
  vm.runInNewContext(code, context, { filename: path.basename(filePath) });
  return context.__OUT__;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function round(value, digits = 3) {
  if (!Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function getPressureIndex(player) {
  const model = player.model || {};
  const stats = player.stats || {};
  if (typeof model.pressure_index_100 === 'number') return model.pressure_index_100;
  return (stats.returnWin || 0.42) * 60
    + (stats.breakConvert || 0.42) * 40
    + (stats.rally_long || 26) / 2.5;
}

function avgSurfaceComeback(player) {
  const surface = player.comeback_surface || {};
  const values = ['hard', 'clay', 'grass']
    .map((key) => surface[key])
    .filter((value) => typeof value === 'number');
  if (values.length) return values.reduce((sum, value) => sum + value, 0) / values.length;
  return player.comeback || 0.25;
}

function computeProxy(player) {
  const comebackAvg = avgSurfaceComeback(player);
  const pressure = getPressureIndex(player);
  const serveBase = player.stats?.breakSave || 0.64;
  const proxy = 50
    + (comebackAvg - 0.25) * 120
    + (pressure - 50) * 0.18
    + (serveBase - 0.64) * 40;
  return clamp(proxy, 25, 80);
}

function percentileScale(value, min, max) {
  if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max) || max <= min) return 0.5;
  return clamp((value - min) / (max - min), 0, 1);
}

function weightForMatches(matches) {
  if (matches >= 20) return 1;
  if (matches >= 8) return 0.6;
  if (matches >= 1) return 0.3;
  return 0;
}

function buildDataset(players, resultsPlayers) {
  const resultsById = new Map(resultsPlayers.players.map((player) => [player.id, player]));
  const eligible = players
    .map((player) => {
      const row = resultsById.get(player.id);
      return row ? {
        id: player.id,
        matches: row.overall.matches,
        recover: row.overall.recoverAfterTwoLossesPct,
        lossAvoid: row.overall.matchLossStreak3Pct == null ? null : 1 - row.overall.matchLossStreak3Pct,
        invLoss: row.overall.avgMaxLossStreak ? 1 / row.overall.avgMaxLossStreak : null
      } : null;
    })
    .filter((row) => row && row.matches >= 20 && row.recover != null && row.lossAvoid != null && row.invLoss != null);

  const mins = {
    recover: Math.min(...eligible.map((row) => row.recover)),
    lossAvoid: Math.min(...eligible.map((row) => row.lossAvoid)),
    invLoss: Math.min(...eligible.map((row) => row.invLoss))
  };
  const maxs = {
    recover: Math.max(...eligible.map((row) => row.recover)),
    lossAvoid: Math.max(...eligible.map((row) => row.lossAvoid)),
    invLoss: Math.max(...eligible.map((row) => row.invLoss))
  };

  const rows = players.map((player) => {
    const res = resultsById.get(player.id);
    const matches = res?.overall.matches || 0;
    const recover = res?.overall.recoverAfterTwoLossesPct ?? null;
    const lossAvoid = res?.overall.matchLossStreak3Pct == null ? null : 1 - res.overall.matchLossStreak3Pct;
    const invLoss = res?.overall.avgMaxLossStreak ? 1 / res.overall.avgMaxLossStreak : null;
    const empirical = (recover != null && lossAvoid != null && invLoss != null)
      ? 100 * (
        0.5 * percentileScale(recover, mins.recover, maxs.recover)
        + 0.3 * percentileScale(lossAvoid, mins.lossAvoid, maxs.lossAvoid)
        + 0.2 * percentileScale(invLoss, mins.invLoss, maxs.invLoss)
      )
      : null;
    const proxy = computeProxy(player);
    const empiricalWeight = weightForMatches(matches);
    const finalValue = empirical == null
      ? proxy
      : proxy * (1 - empiricalWeight) + empirical * empiricalWeight;

    return {
      id: player.id,
      name: player.name,
      matches,
      empirical_game_resilience_100: empirical == null ? null : round(empirical, 1),
      proxy_game_resilience_100: round(proxy, 1),
      game_resilience_100: round(finalValue, 1),
      recoverAfterTwoLossesPct: recover == null ? null : round(recover, 4),
      matchLossStreak3Pct: res?.overall.matchLossStreak3Pct == null ? null : round(res.overall.matchLossStreak3Pct, 4),
      avgMaxLossStreak: res?.overall.avgMaxLossStreak == null ? null : round(res.overall.avgMaxLossStreak, 2)
    };
  }).sort((a, b) => b.game_resilience_100 - a.game_resilience_100 || b.matches - a.matches || a.name.localeCompare(b.name));

  rows.forEach((row, index) => {
    row.rank = index + 1;
  });

  const byId = Object.fromEntries(rows.map((row) => [row.id, row]));
  const values = rows.map((row) => row.game_resilience_100).filter(Number.isFinite);
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;

  return {
    gen: new Date().toISOString().slice(0, 10),
    source: 'results_extra_players.js + players_v3.js',
    description: 'Game-level resilience derived from game-streak patterns, blended with comeback/pressure proxy when PBP sample is small.',
    average_game_resilience_100: round(average, 2),
    top10: rows.slice(0, 10),
    byId
  };
}

function writeOutput(data) {
  const banner = [
    '// Auto-generated by tools/build_player_game_resilience.js',
    `// Source: ${data.source}`,
    `// Average: ${data.average_game_resilience_100}`
  ].join('\n');

  const body = 'window.PLAYER_GAME_RESILIENCE = '
    + JSON.stringify(data)
    + ';\nwindow.PLAYER_GAME_RESILIENCE_BY_ID = window.PLAYER_GAME_RESILIENCE.byId;\n';
  fs.writeFileSync(OUTPUT_PATH, `${banner}\n\n${body}`, 'utf8');
}

function main() {
  const players = loadVar(PLAYERS_PATH, 'PLAYERS_V3');
  const resultsPlayers = loadVar(RESULTS_PLAYERS_PATH, 'window.RESULTS_EXTRA_PLAYERS');
  const data = buildDataset(players, resultsPlayers);
  writeOutput(data);
  console.log(`Wrote ${OUTPUT_PATH}`);
}

main();
