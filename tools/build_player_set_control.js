const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const RESULTS_EXTRA_PATH = path.join(ROOT, 'js', 'results_extra.js');
const PLAYERS_PATH = path.join(ROOT, 'js', 'players_v3.js');
const OUTPUT_PATH = path.join(ROOT, 'js', 'player_set_control.js');

function loadVar(filePath, expression) {
  const context = { console, window: {} };
  context.globalThis = context;
  const code = fs.readFileSync(filePath, 'utf8') + `\n;globalThis.__OUT__ = ${expression};`;
  vm.runInNewContext(code, context, { filename: path.basename(filePath) });
  return context.__OUT__;
}

function normalizeName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function round(value, digits = 4) {
  if (!Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function pct(part, total, digits = 4) {
  if (!total) return null;
  return round(part / total, digits);
}

function fieldsIndex(fields) {
  const out = {};
  fields.forEach((field, index) => {
    out[field] = index;
  });
  return out;
}

function rowObject(raw, index) {
  const out = {};
  for (const [field, idx] of Object.entries(index)) out[field] = raw[idx];
  return out;
}

function buildPlayerMeta(players) {
  const byKey = new Map();
  for (const player of players) {
    const keys = new Set([player.id, normalizeName(player.name)]);
    for (const key of keys) {
      if (!key) continue;
      byKey.set(key, {
        id: player.id,
        name: player.name,
        country: player.country || '',
        flag: player.countryFlag || '',
        era: player.era || '',
        style: player.style || ''
      });
    }
  }
  return byKey;
}

function parseSetScores(score, winnerIndex) {
  const tokens = String(score || '').trim().split(/\s+/).filter(Boolean);
  const sets = [];

  for (const token of tokens) {
    const match = token.match(/(\d+)-(\d+)/);
    if (!match) continue;
    const winnerGames = Number(match[1]);
    const loserGames = Number(match[2]);
    if (!Number.isInteger(winnerGames) || !Number.isInteger(loserGames)) continue;
    if (winnerIndex === 1) {
      sets.push({ p1: winnerGames, p2: loserGames });
    } else if (winnerIndex === 2) {
      sets.push({ p1: loserGames, p2: winnerGames });
    }
  }

  return sets;
}

function splitSequenceBySets(gameSequence, setScores) {
  const sequence = String(gameSequence || '').split('').filter((char) => char === '1' || char === '2');
  const sets = [];
  let cursor = 0;

  for (const setScore of setScores) {
    const setLength = setScore.p1 + setScore.p2;
    const setSequence = sequence.slice(cursor, cursor + setLength);
    if (setSequence.length !== setLength) return null;
    sets.push({ ...setScore, sequence: setSequence });
    cursor += setLength;
  }

  if (cursor !== sequence.length) return null;
  return sets;
}

function createAccumulator() {
  return {
    matches: 0,
    sets: 0,
    setWins: 0,
    breakLeadSets: 0,
    breakLeadSetWins: 0,
    breakLeadSetLosses: 0,
    twoGameLeadSets: 0,
    twoGameLeadSetWins: 0,
    twoGameLeadSetLosses: 0
  };
}

function ensureRecord(records, meta, fallbackName) {
  if (!records.has(meta.id)) {
    records.set(meta.id, {
      id: meta.id,
      name: meta.name || fallbackName,
      country: meta.country || '',
      flag: meta.flag || '',
      era: meta.era || '',
      style: meta.style || '',
      overall: createAccumulator()
    });
  }
  return records.get(meta.id);
}

function analyzeSet(setData, startServerIndex) {
  let serverIndex = startServerIndex;
  let p1Games = 0;
  let p2Games = 0;
  let p1BreakDiff = 0;
  let p2BreakDiff = 0;
  let p1BreakLead = false;
  let p2BreakLead = false;
  let p1TwoGameLead = false;
  let p2TwoGameLead = false;

  for (let gameIndex = 0; gameIndex < setData.sequence.length; gameIndex += 1) {
    const winner = Number(setData.sequence[gameIndex]);
    const isTiebreak = setData.p1 === 7 && setData.p2 === 6 && gameIndex === setData.sequence.length - 1;

    if (winner === 1) p1Games += 1;
    else p2Games += 1;

    if (!isTiebreak) {
      if (winner !== serverIndex) {
        if (winner === 1) {
          p1BreakDiff += 1;
          p2BreakDiff -= 1;
        } else {
          p2BreakDiff += 1;
          p1BreakDiff -= 1;
        }
      }

      if (p1BreakDiff > 0) p1BreakLead = true;
      if (p2BreakDiff > 0) p2BreakLead = true;
    }

    if (p1Games - p2Games >= 2) p1TwoGameLead = true;
    if (p2Games - p1Games >= 2) p2TwoGameLead = true;

    serverIndex = serverIndex === 1 ? 2 : 1;
  }

  const winner = setData.p1 > setData.p2 ? 1 : 2;

  return {
    nextServerIndex: serverIndex,
    winner,
    p1BreakLead,
    p2BreakLead,
    p1TwoGameLead,
    p2TwoGameLead
  };
}

function addSetOutcome(acc, wonSet, hadBreakLead, hadTwoGameLead) {
  acc.sets += 1;
  acc.setWins += wonSet ? 1 : 0;
  if (hadBreakLead) {
    acc.breakLeadSets += 1;
    if (wonSet) acc.breakLeadSetWins += 1;
    else acc.breakLeadSetLosses += 1;
  }
  if (hadTwoGameLead) {
    acc.twoGameLeadSets += 1;
    if (wonSet) acc.twoGameLeadSetWins += 1;
    else acc.twoGameLeadSetLosses += 1;
  }
}

function finalizeAccumulator(acc) {
  return {
    matches: acc.matches,
    sets: acc.sets,
    setWins: acc.setWins,
    setWinPct: pct(acc.setWins, acc.sets),
    breakLeadSets: acc.breakLeadSets,
    breakLeadSetWins: acc.breakLeadSetWins,
    breakLeadSetLosses: acc.breakLeadSetLosses,
    closeSetWithBreakLeadPct: pct(acc.breakLeadSetWins, acc.breakLeadSets),
    loseSetAfterBreakLeadPct: pct(acc.breakLeadSetLosses, acc.breakLeadSets),
    twoGameLeadSets: acc.twoGameLeadSets,
    twoGameLeadSetWins: acc.twoGameLeadSetWins,
    twoGameLeadSetLosses: acc.twoGameLeadSetLosses,
    holdTwoGameLeadPct: pct(acc.twoGameLeadSetWins, acc.twoGameLeadSets),
    loseSetAfterTwoGameLeadPct: pct(acc.twoGameLeadSetLosses, acc.twoGameLeadSets)
  };
}

function buildDataset(resultsExtra, players) {
  const index = fieldsIndex(resultsExtra.fields);
  const playerMeta = buildPlayerMeta(players);
  const records = new Map();

  for (const matchRaw of resultsExtra.matches) {
    const row = rowObject(matchRaw, index);
    const p1Meta = playerMeta.get(row.server1_key) || playerMeta.get(normalizeName(row.server1));
    const p2Meta = playerMeta.get(row.server2_key) || playerMeta.get(normalizeName(row.server2));
    if (!p1Meta?.id || !p2Meta?.id) continue;

    const setScores = parseSetScores(row.score, row.winner);
    const sets = splitSequenceBySets(row.game_sequence, setScores);
    if (!sets || !sets.length) continue;

    const p1Record = ensureRecord(records, p1Meta, row.server1);
    const p2Record = ensureRecord(records, p2Meta, row.server2);
    p1Record.overall.matches += 1;
    p2Record.overall.matches += 1;

    let nextServerIndex = 1;
    for (const setData of sets) {
      const analysis = analyzeSet(setData, nextServerIndex);
      nextServerIndex = analysis.nextServerIndex;

      addSetOutcome(p1Record.overall, analysis.winner === 1, analysis.p1BreakLead, analysis.p1TwoGameLead);
      addSetOutcome(p2Record.overall, analysis.winner === 2, analysis.p2BreakLead, analysis.p2TwoGameLead);
    }
  }

  const playerRows = players.map((player) => {
    const meta = playerMeta.get(player.id) || { id: player.id, name: player.name };
    const record = records.get(player.id) || {
      id: meta.id,
      name: meta.name || player.name,
      country: meta.country || '',
      flag: meta.flag || '',
      era: meta.era || '',
      style: meta.style || '',
      overall: createAccumulator()
    };

    return {
      id: record.id,
      name: record.name,
      country: record.country,
      flag: record.flag,
      era: record.era,
      style: record.style,
      overall: finalizeAccumulator(record.overall)
    };
  });

  const breakLeadRanking = playerRows
    .filter((row) => row.overall.breakLeadSets >= 20 && row.overall.closeSetWithBreakLeadPct != null)
    .sort((a, b) => b.overall.closeSetWithBreakLeadPct - a.overall.closeSetWithBreakLeadPct || b.overall.breakLeadSets - a.overall.breakLeadSets || a.name.localeCompare(b.name))
    .slice(0, 15)
    .map((row, index) => ({
      rank: index + 1,
      id: row.id,
      name: row.name,
      breakLeadSets: row.overall.breakLeadSets,
      closeSetWithBreakLeadPct: row.overall.closeSetWithBreakLeadPct
    }));

  const twoGameRanking = playerRows
    .filter((row) => row.overall.twoGameLeadSets >= 20 && row.overall.holdTwoGameLeadPct != null)
    .sort((a, b) => b.overall.holdTwoGameLeadPct - a.overall.holdTwoGameLeadPct || b.overall.twoGameLeadSets - a.overall.twoGameLeadSets || a.name.localeCompare(b.name))
    .slice(0, 15)
    .map((row, index) => ({
      rank: index + 1,
      id: row.id,
      name: row.name,
      twoGameLeadSets: row.overall.twoGameLeadSets,
      holdTwoGameLeadPct: row.overall.holdTwoGameLeadPct
    }));

  return {
    gen: new Date().toISOString().slice(0, 10),
    source: 'results_extra.js + players_v3.js',
    description: 'Set-level control metrics derived from point-by-point game sequences: closing sets after earning a break lead and holding sets after opening a 2-game lead.',
    totalPlayers: playerRows.length,
    topCloseSetWithBreakLead: breakLeadRanking,
    topHoldTwoGameLead: twoGameRanking,
    players: playerRows
  };
}

function writeOutput(data) {
  const banner = [
    '// Auto-generated by tools/build_player_set_control.js',
    `// Source: ${data.source}`,
    `// Players: ${data.totalPlayers}`
  ].join('\n');

  const body = `window.PLAYER_SET_CONTROL = ${JSON.stringify(data)};\nwindow.PLAYER_SET_CONTROL_BY_ID = Object.fromEntries(window.PLAYER_SET_CONTROL.players.map((player) => [player.id, player]));\n`;
  fs.writeFileSync(OUTPUT_PATH, `${banner}\n\n${body}`, 'utf8');
}

function main() {
  const resultsExtra = loadVar(RESULTS_EXTRA_PATH, 'RESULTS_EXTRA');
  const players = loadVar(PLAYERS_PATH, 'PLAYERS_V3');
  const data = buildDataset(resultsExtra, players);
  writeOutput(data);
  console.log(`Wrote ${OUTPUT_PATH}`);
  console.log(`Players: ${data.totalPlayers}`);
}

main();
