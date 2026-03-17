const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const SIMS_PER_REAL_MATCH = 8;
const NADAL_ID = 'nadal';

function loadJsVar(filePath, varName, extras = {}) {
  const code = fs.readFileSync(filePath, 'utf8') + `\n;globalThis.__OUT__ = ${varName};`;
  const context = {
    console,
    Math,
    require,
    globalThis: {},
    ...extras
  };
  vm.runInNewContext(code, context, { filename: path.basename(filePath) });
  return context.__OUT__;
}

function loadContext() {
  const playersPath = path.join(ROOT, 'js', 'players.js');
  const enginePath = path.join(ROOT, 'js', 'engine.js');
  const resultsPath = path.join(ROOT, 'js', 'results_db.js');

  const playersCode = fs.readFileSync(playersPath, 'utf8') + '\n;globalThis.__PLAYERS__ = PLAYERS;';
  const engineCode = fs.readFileSync(enginePath, 'utf8') + '\n;globalThis.__SIMSET__ = simSet;';
  const resultsCode = fs.readFileSync(resultsPath, 'utf8') + '\n;globalThis.__RESULTS_DB__ = RESULTS_DB;';

  const context = {
    console,
    Math,
    require,
    globalThis: {}
  };

  vm.runInNewContext(playersCode, context, { filename: 'players.js' });
  vm.runInNewContext(engineCode, context, { filename: 'engine.js' });
  vm.runInNewContext(resultsCode, context, { filename: 'results_db.js' });

  return {
    PLAYERS: context.globalThis.__PLAYERS__,
    RESULTS_DB: context.globalThis.__RESULTS_DB__,
    simSet: context.globalThis.__SIMSET__
  };
}

function makeBucket() {
  return {
    matches: 0,
    returnGames: 0,
    returnBreaks: 0,
    returnAdj2: 0,
    returnAdj2Hits: 0,
    returnAdj3: 0,
    returnAdj3Hits: 0,
    serveGames: 0,
    serveBroken: 0,
    serveAdj2: 0,
    serveAdj2Hits: 0,
    serveAdj3: 0,
    serveAdj3Hits: 0,
    matchWinStreak2: 0,
    matchWinStreak3: 0,
    matchLossStreak2: 0,
    matchLossStreak3: 0,
    lostFirstSetReal: 0,
    wonAfterLosingFirstReal: 0,
    lostFirstSetSim: 0,
    wonAfterLosingFirstSim: 0
  };
}

function bestOfFromLevel(level) {
  return level === 'Grand Slam' || level === 'Davis Cup' ? 5 : 3;
}

function surfaceKey(code) {
  return code === 'C' ? 'clay' : code === 'G' ? 'grass' : 'hard';
}

function simulateMatchWithLogs(simSet, p1, p2, surface, bestOf, useTb) {
  const setsNeeded = Math.ceil(bestOf / 2);
  const sets = [0, 0];
  const setLogs = [];
  const setScores = [];
  let gamesPlayed = 0;
  const firstServer = Math.random() < 0.5 ? 0 : 1;

  while (sets[0] < setsNeeded && sets[1] < setsNeeded) {
    const setNum = sets[0] + sets[1];
    const isFinal = setNum === bestOf - 1;
    const result = simSet(p1, p2, surface, isFinal, useTb, (firstServer + gamesPlayed) % 2, sets);
    gamesPlayed += result.gameCount;
    sets[result.winner] += 1;
    setLogs.push(result.gameLog || []);
    setScores.push(result.games || [0, 0]);
  }

  return { sets, setLogs, setScores };
}

function updateStreakWindows(sequence, hitValue, bucket, adj2Key, adj2HitsKey, adj3Key, adj3HitsKey) {
  for (let i = 0; i < sequence.length - 1; i++) {
    bucket[adj2Key] += 1;
    if (sequence[i] === hitValue && sequence[i + 1] === hitValue) bucket[adj2HitsKey] += 1;
  }
  for (let i = 0; i < sequence.length - 2; i++) {
    bucket[adj3Key] += 1;
    if (sequence[i] === hitValue && sequence[i + 1] === hitValue && sequence[i + 2] === hitValue) {
      bucket[adj3HitsKey] += 1;
    }
  }
}

function hasRun(sequence, value, runLength) {
  let streak = 0;
  for (const item of sequence) {
    streak = item === value ? streak + 1 : 0;
    if (streak >= runLength) return true;
  }
  return false;
}

function analyzeMatch(matchLogs, nadalIndex, bucket) {
  const returnSeq = [];
  const serveBreakSeq = [];
  const overallSeq = [];

  for (const gameLog of matchLogs) {
    let prev = [0, 0];
    for (const game of gameLog) {
      const winner = game.score[0] > prev[0] ? 0 : 1;
      const server = game.serving;
      const nadalWon = winner === nadalIndex ? 1 : 0;
      overallSeq.push(nadalWon);

      if (server === nadalIndex) {
        const held = winner === nadalIndex ? 1 : 0;
        bucket.serveGames += 1;
        bucket.serveBroken += held ? 0 : 1;
        serveBreakSeq.push(held ? 0 : 1);
      } else {
        const broke = winner === nadalIndex ? 1 : 0;
        bucket.returnGames += 1;
        bucket.returnBreaks += broke;
        returnSeq.push(broke);
      }
      prev = game.score;
    }
  }

  updateStreakWindows(returnSeq, 1, bucket, 'returnAdj2', 'returnAdj2Hits', 'returnAdj3', 'returnAdj3Hits');
  updateStreakWindows(serveBreakSeq, 1, bucket, 'serveAdj2', 'serveAdj2Hits', 'serveAdj3', 'serveAdj3Hits');

  bucket.matchWinStreak2 += hasRun(overallSeq, 1, 2) ? 1 : 0;
  bucket.matchWinStreak3 += hasRun(overallSeq, 1, 3) ? 1 : 0;
  bucket.matchLossStreak2 += hasRun(overallSeq, 0, 2) ? 1 : 0;
  bucket.matchLossStreak3 += hasRun(overallSeq, 0, 3) ? 1 : 0;
  bucket.matches += 1;
}

function parseFirstSetToken(scoreStr) {
  if (!scoreStr || typeof scoreStr !== 'string') return null;
  const token = scoreStr.match(/(\d+)-(\d+)/);
  if (!token) return null;
  return [Number(token[1]), Number(token[2])];
}

function pct(num, den) {
  return den ? num / den : 0;
}

function summarize(bucket) {
  return {
    matches: bucket.matches,
    breakProb: pct(bucket.returnBreaks, bucket.returnGames),
    break2: pct(bucket.returnAdj2Hits, bucket.returnAdj2),
    break3: pct(bucket.returnAdj3Hits, bucket.returnAdj3),
    brokenProb: pct(bucket.serveBroken, bucket.serveGames),
    broken2: pct(bucket.serveAdj2Hits, bucket.serveAdj2),
    broken3: pct(bucket.serveAdj3Hits, bucket.serveAdj3),
    matchWin2: pct(bucket.matchWinStreak2, bucket.matches),
    matchWin3: pct(bucket.matchWinStreak3, bucket.matches),
    matchLoss2: pct(bucket.matchLossStreak2, bucket.matches),
    matchLoss3: pct(bucket.matchLossStreak3, bucket.matches)
  };
}

function fmtPct(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function main() {
  const { PLAYERS, RESULTS_DB, simSet } = loadContext();
  const playerById = new Map(PLAYERS.map((player) => [player.id, player]));
  const nadal = playerById.get(NADAL_ID);
  if (!nadal) throw new Error('Nadal not found');

  const overall = makeBucket();
  const perSurface = { hard: makeBucket(), clay: makeBucket(), grass: makeBucket() };
  const opponentCounts = new Map();

  for (const match of RESULTS_DB.matches) {
    const [winnerId, loserId, surfCode, level] = match;
    if (winnerId !== NADAL_ID && loserId !== NADAL_ID) continue;
    const opponentId = winnerId === NADAL_ID ? loserId : winnerId;
    const opponent = playerById.get(opponentId);
    if (!opponent) continue;

    const surface = surfaceKey(surfCode);
    const bestOf = bestOfFromLevel(level);
    opponentCounts.set(opponentId, (opponentCounts.get(opponentId) || 0) + 1);

    for (let i = 0; i < SIMS_PER_REAL_MATCH; i++) {
      const nadalAsP1 = Math.random() < 0.5;
      const p1 = nadalAsP1 ? nadal : opponent;
      const p2 = nadalAsP1 ? opponent : nadal;
      const nadalIndex = nadalAsP1 ? 0 : 1;
      const result = simulateMatchWithLogs(simSet, p1, p2, surface, bestOf, true);
      analyzeMatch(result.setLogs, nadalIndex, overall);
      analyzeMatch(result.setLogs, nadalIndex, perSurface[surface]);

      const firstSet = result.setScores[0];
      if (firstSet && firstSet[nadalIndex] < firstSet[1 - nadalIndex]) {
        overall.lostFirstSetSim += 1;
        perSurface[surface].lostFirstSetSim += 1;
        if (result.sets[nadalIndex] > result.sets[1 - nadalIndex]) {
          overall.wonAfterLosingFirstSim += 1;
          perSurface[surface].wonAfterLosingFirstSim += 1;
        }
      }
    }

    const firstSetReal = parseFirstSetToken(match[6]);
    if (firstSetReal) {
      const nadalWonReal = winnerId === NADAL_ID;
      const nadalFirstSetGames = nadalWonReal ? firstSetReal[0] : firstSetReal[1];
      const oppFirstSetGames = nadalWonReal ? firstSetReal[1] : firstSetReal[0];
      if (nadalFirstSetGames < oppFirstSetGames) {
        overall.lostFirstSetReal += 1;
        perSurface[surface].lostFirstSetReal += 1;
        if (nadalWonReal) {
          overall.wonAfterLosingFirstReal += 1;
          perSurface[surface].wonAfterLosingFirstReal += 1;
        }
      }
    }
  }

  const breakModelPath = path.join('C:', 'Users', 'gabri', 'Downloads', 'tennis_break_model.csv');
  const breakCsv = fs.readFileSync(breakModelPath, 'utf8').split(/\r?\n/);
  const nadalRow = breakCsv.find((line) => line.startsWith('Rafael Nadal,'));
  const [player, era, style, comeback, holdStrength, pressure, longPenalty, breakProbModel, break2Model, break3Model] = nadalRow.split(',');

  const summary = summarize(overall);
  const hard = summarize(perSurface.hard);
  const clay = summarize(perSurface.clay);
  const grass = summarize(perSurface.grass);

  console.log(`Nadal schedule sample: ${opponentCounts.size} opponents, ${summary.matches} simulated matches (${SIMS_PER_REAL_MATCH} sims per real match).`);
  console.log('');
  console.log('Real-derived proxy row (tennis_break_model.csv):');
  console.log(`  break_prob_model=${breakProbModel} | break2_consecutive_model=${break2Model} | break3_consecutive_model=${break3Model}`);
  console.log('');
  console.log('Simulated overall vs real-derived proxy:');
  console.log(`  break prob: ${fmtPct(summary.breakProb)} vs ${fmtPct(Number(breakProbModel))}`);
  console.log(`  2 consecutive breaks: ${fmtPct(summary.break2)} vs ${fmtPct(Number(break2Model))}`);
  console.log(`  3 consecutive breaks: ${fmtPct(summary.break3)} vs ${fmtPct(Number(break3Model))}`);
  console.log('');
  console.log('Lose first set -> still win match:');
  console.log(`  real DB schedule: ${fmtPct(pct(overall.wonAfterLosingFirstReal, overall.lostFirstSetReal))} (${overall.wonAfterLosingFirstReal}/${overall.lostFirstSetReal})`);
  console.log(`  simulated schedule: ${fmtPct(pct(overall.wonAfterLosingFirstSim, overall.lostFirstSetSim))} (${overall.wonAfterLosingFirstSim}/${overall.lostFirstSetSim})`);
  console.log('');
  console.log('Simulated service collapse (no direct real proxy in current files):');
  console.log(`  broken in a service game: ${fmtPct(summary.brokenProb)}`);
  console.log(`  broken in 2 straight service games: ${fmtPct(summary.broken2)}`);
  console.log(`  broken in 3 straight service games: ${fmtPct(summary.broken3)}`);
  console.log('');
  console.log('Simulated match-level game streaks:');
  console.log(`  has 2+ games won in a row: ${fmtPct(summary.matchWin2)}`);
  console.log(`  has 3+ games won in a row: ${fmtPct(summary.matchWin3)}`);
  console.log(`  suffers 2+ games lost in a row: ${fmtPct(summary.matchLoss2)}`);
  console.log(`  suffers 3+ games lost in a row: ${fmtPct(summary.matchLoss3)}`);
  console.log('');
  console.log('By surface (simulated):');
  for (const [label, item, raw] of [['hard', hard, perSurface.hard], ['clay', clay, perSurface.clay], ['grass', grass, perSurface.grass]]) {
    const realComeback = pct(raw.wonAfterLosingFirstReal, raw.lostFirstSetReal);
    const simComeback = pct(raw.wonAfterLosingFirstSim, raw.lostFirstSetSim);
    console.log(`  ${label}: break ${fmtPct(item.breakProb)} | break2 ${fmtPct(item.break2)} | break3 ${fmtPct(item.break3)} | broken2 ${fmtPct(item.broken2)} | broken3 ${fmtPct(item.broken3)} | comeback real ${fmtPct(realComeback)} vs sim ${fmtPct(simComeback)}`);
  }
}

main();
