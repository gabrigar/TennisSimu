// ============================================================
// TENNIS LEGENDS SIMULATOR — ENGINE v3
// ============================================================
// CHANGES vs v2:
//
// FIX C — Surface bias in rally distribution (data-driven)
//   Based on real ATP stats: clay averages 4.3 shots/point,
//   grass 3.4 shots/point, hard ~3.8. Applied as absolute
//   shifts to short/long before blending player profiles.
//   Clay:  short -8pp, long +6pp
//   Grass: short +8pp, long -6pp
//   Hard:  no shift (reference surface)
//
// FIX D — Server vulnerability in long rallies (error displacement)
//   A player whose natural rally_long% is below the actual
//   match long-rally rate is "out of zone": their effective
//   error rate rises proportionally (k=4.5).
//   Only fires when actualLong > player's naturalLong (asymmetric).
//   Combined with returner's longRallySkill, the Nadal-Roddick
//   gap in long rallies grows from 0.015 to ~0.055 as intended.
//
//   Key calibration references:
//   - Ivanisevic (err=38, long=19) in clay: effectiveErrors ~52  ✓
//   - Roddick vs Nadal hard: pw_adj gap ~0.055                   ✓
//   - Djokovic vs Nadal hard: near-symmetric (~0.056 vs 0.059)   ✓
// ============================================================

// CALIBRATION FACTOR: dampens surface modifiers
const SURF_CALIBRATION = 0.55;

// FIX A — Return pressure relative to field average
let _avgReturnWin = null;
function getAvgReturnWin() {
  if (_avgReturnWin === null) {
    _avgReturnWin = (typeof PLAYERS !== 'undefined' && PLAYERS.length)
      ? PLAYERS.reduce((s, p) => s + p.stats.returnWin, 0) / PLAYERS.length
      : 0.426;
  }
  return _avgReturnWin;
}

function calibratedSurf(player, surface) {
  const raw = player.stats.surface[surface] || 1.0;
  return 1.0 + (raw - 1.0) * SURF_CALIBRATION;
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ============================================================
// FIX C — getRallyProfile with data-driven surface bias
// ============================================================
// Real ATP data (Brain Game Tennis / Mattspoint):
//   Clay:  ~4.3 shots/point — longest rallies, 9+ shots +1.2pp vs hard
//   Hard:  ~3.8 shots/point — reference surface
//   Grass: ~3.4 shots/point — 40% of 1st serves unreturned
//
// Surface bias is applied as absolute pp shifts BEFORE normalizing,
// so the match profile blends player styles + surface reality.
// ============================================================
const SURFACE_BIAS = {
  clay:  { short: -8, mid: +2, long: +6 },
  hard:  { short:  0, mid:  0, long:  0 },
  grass: { short: +8, mid: +1, long: -9 }
};

function getRallyProfile(p1, p2, surface) {
  const s1 = p1.stats, s2 = p2.stats;

  // Step 1: average player profiles
  let short = (s1.rally_short + s2.rally_short) / 2;
  let mid   = (s1.rally_mid   + s2.rally_mid)   / 2;
  let long  = (s1.rally_long  + s2.rally_long)  / 2;

  // Step 2: apply surface bias (data-driven absolute shifts)
  const bias = SURFACE_BIAS[surface] || SURFACE_BIAS.hard;
  short += bias.short;
  mid   += bias.mid;
  long  += bias.long;

  // Step 3: clamp to avoid negatives and renormalize
  short = Math.max(short, 5);
  mid   = Math.max(mid,   5);
  long  = Math.max(long,  5);
  const total = short + mid + long;

  return { short: short/total, mid: mid/total, long: long/total };
}

// ============================================================
// FIX D — Server vulnerability from error displacement
// ============================================================
// When a match produces more long rallies than a player's natural
// profile, they are "out of zone". Their effective error rate rises:
//   effectiveErrors = baseErrors * (1 + displacement * K_DISPLACEMENT)
// Only fires when actualLong > naturalLong (asymmetric by design —
// the serve already penalizes defensive players on fast surfaces).
//
// FIX C — net_win attenuation (ENGINE v4)
// Players with high net_win (Federer 0.72, Sampras 0.78, Edberg 0.76) can
// cut long rallies by approaching the net. Their effective displacement is
// reduced proportionally to how much their net_win exceeds the field average.
// netAttenuation = min(0.60, max(0, net_win - AVG_NET) * FACTOR_N)
// displacement_effective = displacement_raw * (1 - netAttenuation)
//
// Federer (net_win=0.72): ~35% attenuation → vuln nearly neutral in hard
// Sampras/Edberg (0.78/0.76): ~55-60% attenuation → protected in most surfaces
// Roddick (0.65): 0% attenuation → pays full displacement (correct)
// Baselines (Murray 0.62, Lendl 0.60): slight negative → no attenuation
//
// Calibration references:
// - Ivanisevic clay vs Nadal: effectiveErrors ~52          ✓ (unchanged)
// - Nadal-Roddick hard long-rally gap: ~0.055              ✓ (unchanged)
// - Federer hard vs Murray: near-symmetric in long rallies ✓ (new)
// ============================================================
const AVG_ERRORS_PER_SET = 26;   // field average from players.js
const K_DISPLACEMENT     = 4.5;
const FACTOR_V           = 0.062;
const AVG_NET_WIN        = 0.65; // field average net_win
const FACTOR_N           = 5.0;  // net attenuation strength

function serverVulnerability(server, actualLongPct) {
  const sS = server.stats || server;
  const netWin = server.net_win || AVG_NET_WIN;

  // How much this server can cut long rallies via net approach
  const netAttenuation = Math.min(0.60, Math.max(0, netWin - AVG_NET_WIN) * FACTOR_N);

  const naturalLong  = sS.rally_long / 100;
  const dispRaw      = Math.max(0, actualLongPct - naturalLong);
  const dispEff      = dispRaw * (1 - netAttenuation);

  const effectiveErrors = sS.errors * (1 + dispEff * K_DISPLACEMENT);
  return (effectiveErrors - AVG_ERRORS_PER_SET) / AVG_ERRORS_PER_SET * FACTOR_V;
}

// ============================================================
function calcWinProbServe(server, returner, surface) {
  const sS = server.stats, rS = returner.stats;

  const sMod = calibratedSurf(server, surface);
  const rMod = calibratedSurf(returner, surface);

  const baseServe          = sS.serve1pct * sS.win1st + (1 - sS.serve1pct) * sS.win2nd;
  const serveSpeedBonus    = ((sS.serve_kmh || 205) - 175) / 75 * 0.03;
  const serverPower        = (((sS.fh_kmh||148) + (sS.bh_kmh||138)) / 2 - 120) / 55 * 0.02;
  const serverShortRallyBonus = ((sS.rally_short||40) - 38) / 100 * 0.015;

  // FIX A — return relative to field average
  const returnSpeedFactor = ((rS.rest_kmh||148) - 125) / 40 * 0.02;
  const returnRelative    = (rS.returnWin - getAvgReturnWin()) * rMod;
  const returnPressure    = returnRelative * 0.30 + returnSpeedFactor * 0.5;

  const netBonus = ((server.net_win || 0.65) - 0.65) * 0.04;

  const prob = (baseServe * sMod) + serveSpeedBonus + serverPower * 0.5
               + serverShortRallyBonus + netBonus - returnPressure;
  return clamp(prob, 0.40, 0.75);
}

function simPoint(pWin) { return Math.random() < pWin; }

// ============================================================
// simGame — receives full server/returner objects (Fix C needs net_win)
// sS/rS kept as shorthands to avoid touching inner logic
// ============================================================
function simGame(pWin, rallyProf, server, returner, isFinal) {
  const sS = server.stats || server;
  const rS = returner.stats || returner;
  let pts = [0, 0];
  while (true) {
    const r = Math.random();
    let pw;
    if (r < rallyProf.short) {
      // Short rally: serve dominates, return speed matters
      const returnSpeedAdj = ((rS.rest_kmh||148) - 148) / 40 * 0.04;
      pw = clamp(pWin + 0.04 - returnSpeedAdj, 0.38, 0.80);

    } else if (r < rallyProf.short + rallyProf.mid) {
      // Mid rally: slight advantage to server fades
      pw = clamp(pWin - 0.01, 0.38, 0.75);

    } else {
      // Long rally: returner consistency + server vulnerability
      //
      // longRallySkill: how well the RETURNER handles long exchanges
      // (unchanged from v2, based on rally_long and groundstroke power)
      const longRallySkill = ((rS.rally_long||26) - 26) / 34 * 0.06;
      const groundAdv      = (((rS.fh_kmh||148) + (rS.bh_kmh||138)) / 2 - 143) / 35 * 0.03;

      // FIX D: server vulnerability — how out-of-zone the SERVER is
      // when this match produces more long rallies than their natural profile.
      // Ivanisevic serving in clay vs Nadal: pays heavily.
      // Djokovic serving vs Nadal in hard: near-neutral (displacement ~0).
      const vuln = serverVulnerability(server, rallyProf.long);

      pw = clamp(pWin - 0.06 - longRallySkill - groundAdv - vuln, 0.28, 0.70);
    }
    if (simPoint(pw)) pts[0]++; else pts[1]++;
    if (pts[0] >= 4 && pts[0] - pts[1] >= 2) return 0;
    if (pts[1] >= 4 && pts[1] - pts[0] >= 2) return 1;
  }
}

function simTiebreak(pWin, server, returner) {
  let pts = [0, 0];
  while (true) {
    const srvTB = ((server.tb_win  || 0.62) - 0.62) * 0.08;
    const retTB = ((returner.tb_win || 0.62) - 0.62) * 0.08;
    const tbPW  = clamp(pWin + 0.02 + srvTB - retTB, 0.38, 0.80);
    if (simPoint(tbPW)) pts[0]++; else pts[1]++;
    if (pts[0] >= 7 && pts[0] - pts[1] >= 2) return 0;
    if (pts[1] >= 7 && pts[1] - pts[0] >= 2) return 1;
  }
}

function simSet(p1, p2, surface, isFinal, useTb, firstServer, sets) {
  let games = [0, 0], gameCount = 0, gameLog = [];
  let rallyStats = { short: 0, mid: 0, long: 0 };
  const rallyProf = getRallyProfile(p1, p2, surface);

  // FIX B — Asymmetric pressure-scaled dec_win
  const rivalSetsP1 = sets ? sets[1] : (isFinal ? 2 : 0);
  const rivalSetsP2 = sets ? sets[0] : (isFinal ? 2 : 0);
  const pressP1 = rivalSetsP1 / 3;
  const pressP2 = rivalSetsP2 / 3;
  const p1DecBonus = ((p1.dec_win||0.64) - 0.64) * 0.06 * pressP1;
  const p2DecBonus = ((p2.dec_win||0.64) - 0.64) * 0.06 * pressP2;

  while (true) {
    const serving  = (firstServer + gameCount) % 2;
    const server   = serving === 0 ? p1 : p2;
    const returner = serving === 0 ? p2 : p1;
    const basePSrv = calcWinProbServe(server, returner, surface);
    const decBonus = serving === 0 ? p1DecBonus - p2DecBonus : p2DecBonus - p1DecBonus;
    const pSrv     = clamp(basePSrv + decBonus, 0.38, 0.78);

    if (games[0] === 6 && games[1] === 6) {
      if (useTb) {
        const tbW = simTiebreak(pSrv, server, returner);
        const gw  = tbW === 0 ? serving : 1 - serving;
        games[gw]++; gameCount++;
        gameLog.push({ serving, score: [...games], tb: true });
        break;
      } else {
        const gwGame = simGame(pSrv, rallyProf, server, returner, isFinal);
        const gw     = gwGame === 0 ? serving : 1 - serving;
        games[gw]++; gameCount++;
        gameLog.push({ serving, score: [...games] });
        if (Math.abs(games[0] - games[1]) >= 2) break;
      }
    } else {
      const gwGame = simGame(pSrv, rallyProf, server, returner, isFinal);
      const gw     = gwGame === 0 ? serving : 1 - serving;
      games[gw]++; gameCount++;
      gameLog.push({ serving, score: [...games] });
      if ((games[0] >= 6 || games[1] >= 6) && Math.abs(games[0] - games[1]) >= 2) break;
      if (games[0] === 7 || games[1] === 7) break;
    }
  }
  return {
    games, gameCount,
    winner: games[0] > games[1] ? 0 : 1,
    gameLog, rallyStats
  };
}

function simMatch(p1, p2, surface, bestOf, useTb) {
  const setsNeeded = Math.ceil(bestOf / 2);
  let sets = [0, 0];
  const setScores = [];
  let firstServer = Math.random() < 0.5 ? 0 : 1;
  let gamesPlayed = 0;

  while (sets[0] < setsNeeded && sets[1] < setsNeeded) {
    const setNum  = sets[0] + sets[1];
    const isFinal = setNum === bestOf - 1;
    const result  = simSet(p1, p2, surface, isFinal, useTb, (firstServer + gamesPlayed) % 2, sets);
    gamesPlayed  += result.gameCount;
    sets[result.winner]++;
    setScores.push(result.games);
  }

  const winner = sets[0] > sets[1] ? p1 : p2;
  const loser  = sets[0] > sets[1] ? p2 : p1;

  return { winner, loser, sets, setScores, surface,
           scoreStr: setScores.map(s => s.join('-')).join(' ') };
}

// ============================================================
// PARTICLES
// ============================================================
function spawnParticles(el, color) {
  if (!el) return;
  const rect = el.getBoundingClientRect();
  for (let i = 0; i < 12; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const angle = (i / 12) * Math.PI * 2;
    const dist  = 30 + Math.random() * 40;
    p.style.cssText = `left:${rect.left + rect.width/2}px;top:${rect.top + rect.height/2}px;`
      + `background:${color};position:fixed;`
      + `--tx:${Math.cos(angle)*dist}px;--ty:${Math.sin(angle)*dist}px;`
      + `animation-delay:${Math.random()*0.1}s;z-index:9999;`;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 700);
  }
}
