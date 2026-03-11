// ============================================================
// TENNIS LEGENDS SIMULATOR — ENGINE v2
// Calibrated surface modifiers for realistic H2H results
// ============================================================

// CALIBRATION FACTOR: dampens surface modifiers
// Raw player surface values deviate too far from 1.0, causing
// extreme results (Federer 96% on grass vs Nadal, real=60%).
// We blend each modifier 50% toward neutral (1.0).
const SURF_CALIBRATION = 0.55; // 0=ignore surface, 1=full modifier

function calibratedSurf(player, surface) {
  const raw = player.stats.surface[surface] || 1.0;
  return 1.0 + (raw - 1.0) * SURF_CALIBRATION;
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function calcWinProbServe(server, returner, surface) {
  const sS = server.stats, rS = returner.stats;

  // Calibrated surface modifier (dampened toward neutral)
  const sMod = calibratedSurf(server, surface);
  const rMod = calibratedSurf(returner, surface);

  // Base serve probability
  const baseServe = sS.serve1pct * sS.win1st + (1 - sS.serve1pct) * sS.win2nd;

  // Serve speed bonus: up to +3%
  const serveSpeedBonus = ((sS.serve_kmh || 205) - 175) / 75 * 0.03;

  // Groundstroke power
  const serverPower = (((sS.fh_kmh||148) + (sS.bh_kmh||138)) / 2 - 120) / 55 * 0.02;

  // Short rally bonus (serve+volley, big servers)
  const serverShortRallyBonus = ((sS.rally_short||40) - 38) / 100 * 0.015;

  // Return pressure — calibrated surface mod for returner
  const returnSpeedFactor = ((rS.rest_kmh||148) - 125) / 40 * 0.02;
  const returnPressure = rS.returnWin * rMod * (1 - serverPower * 0.3) + returnSpeedFactor * 0.5;

  // Net game bonus
  const netBonus = ((server.net_win || 0.65) - 0.65) * 0.04;

  const prob = (baseServe * sMod) + serveSpeedBonus + serverPower * 0.5
               + serverShortRallyBonus + netBonus - (returnPressure * 0.15);
  return clamp(prob, 0.40, 0.75);
}

function getRallyProfile(p1, p2, surface) {
  const s1 = p1.stats, s2 = p2.stats;
  let short = (s1.rally_short + s2.rally_short) / 2;
  let mid   = (s1.rally_mid   + s2.rally_mid)   / 2;
  let long  = (s1.rally_long  + s2.rally_long)  / 2;
  // Calibrated surface effect on rally length
  const surfMod = surface === 'clay' ? 1.10 : (surface === 'grass' ? 0.90 : 1.0);
  const adjLong  = long  * surfMod;
  const adjShort = short / surfMod;
  const total = adjShort + mid + adjLong;
  return { short: adjShort/total, mid: mid/total, long: adjLong/total };
}

function simPoint(pWin) { return Math.random() < pWin; }

function simGame(pWin, rallyProf, sS, rS, isFinal) {
  let pts = [0, 0];
  while (true) {
    const r = Math.random();
    let pw;
    if (r < rallyProf.short) {
      const returnSpeedAdj = ((rS.rest_kmh||148) - 148) / 40 * 0.04;
      pw = clamp(pWin + 0.04 - returnSpeedAdj, 0.38, 0.80);
    } else if (r < rallyProf.short + rallyProf.mid) {
      pw = clamp(pWin - 0.01, 0.38, 0.75);
    } else {
      const longRallySkill = ((rS.rally_long||26) - 26) / 34 * 0.06;
      const groundAdv = (((rS.fh_kmh||148) + (rS.bh_kmh||138)) / 2 - 143) / 35 * 0.03;
      pw = clamp(pWin - 0.06 - longRallySkill - groundAdv, 0.30, 0.70);
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

function simSet(p1, p2, surface, isFinal, useTb, firstServer) {
  let games = [0, 0], gameCount = 0, gameLog = [];
  let rallyStats = { short: 0, mid: 0, long: 0 };
  const rallyProf = getRallyProfile(p1, p2, surface);
  const p1DecBonus = isFinal ? ((p1.dec_win||0.64) - 0.64) * 0.03 : 0;
  const p2DecBonus = isFinal ? ((p2.dec_win||0.64) - 0.64) * 0.03 : 0;

  while (true) {
    const serving  = (firstServer + gameCount) % 2;
    const server   = serving === 0 ? p1 : p2;
    const returner = serving === 0 ? p2 : p1;
    const basePSrv = calcWinProbServe(server, returner, surface);
    const decBonus = serving === 0 ? p1DecBonus - p2DecBonus : p2DecBonus - p1DecBonus;
    const pSrv     = clamp(basePSrv + (isFinal ? decBonus : 0), 0.38, 0.78);

    if (games[0] === 6 && games[1] === 6) {
      if (useTb) {
        const tbW = simTiebreak(pSrv, server, returner);
        const gw  = tbW === 0 ? serving : 1 - serving;
        games[gw]++; gameCount++;
        gameLog.push({ serving, score: [...games], tb: true });
        break;
      } else {
        const gwGame = simGame(pSrv, rallyProf, server.stats, returner.stats, isFinal);
        const gw     = gwGame === 0 ? serving : 1 - serving;
        games[gw]++; gameCount++;
        gameLog.push({ serving, score: [...games] });
        if (Math.abs(games[0] - games[1]) >= 2) break;
      }
    } else {
      const gwGame = simGame(pSrv, rallyProf, server.stats, returner.stats, isFinal);
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
  let rallyTotals = { short: [0,0], mid: [0,0], long: [0,0] };

  while (sets[0] < setsNeeded && sets[1] < setsNeeded) {
    const setNum  = sets[0] + sets[1];
    const isFinal = setNum === bestOf - 1;
    const result  = simSet(p1, p2, surface, isFinal, useTb, (firstServer + gamesPlayed) % 2);
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
