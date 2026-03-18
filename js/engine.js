// ============================================================
// TENNIS LEGENDS SIMULATOR — ENGINE v7
// ============================================================
//
// Motor Markov de simulación punto a punto.
// Cada partido se simula game por game → set por set → partido.
// La probabilidad de ganar un punto al saque (pWin) se calcula
// combinando los stats del servidor y del restador, luego se
// ajusta por el tipo de rally (corto / medio / largo).
//
// ============================================================
// HISTORIAL COMPLETO DE FIXES
// ============================================================
//
// ─────────────────────────────────────────────────────────────
// FIX A — Return pressure relativo a la media del campo  (v2)
// ─────────────────────────────────────────────────────────────
// PROBLEMA DETECTADO:
//   La penalización original por devolución usaba el valor
//   absoluto de returnWin multiplicado por 0.15. La diferencia
//   máxima entre el mejor returner (Djokovic 0.50) y el peor
//   (Sampras 0.34) era solo 0.024pp en pWin. El bonus de
//   velocidad de saque de Roddick por sí solo equivalía a
//   0.030pp, casi cancelando toda la ventaja de devolución.
//   Resultado: los sacadores dominaban independientemente de su
//   capacidad de devolución.
//
// SOLUCIÓN:
//   Solo la parte que supera el promedio del campo (0.426)
//   penaliza al servidor. Djokovic (0.50) penaliza +0.074
//   relativo; Sampras (0.34) da un ligero bonus al servidor rival.
//   Un returner promedio no penaliza ni beneficia.
//
//   returnRelative = (returnWin − avgFieldReturnWin) × rMod
//   returnPressure = returnRelative × 0.30 + retSpeedFactor × 0.50
//
// ─────────────────────────────────────────────────────────────
// FIX B — dec_win asimétrico con presión por marcador  (v2)
//          → REEMPLAZADO por FIX G en v6
// ─────────────────────────────────────────────────────────────
// PROBLEMA DETECTADO:
//   dec_win solo activaba en el set final con multiplicador 0.03.
//   La diferencia entre Nadal (dec_win=0.70) y Kyrgios
//   (dec_win=0.58) era de solo 0.0036pp. Además ignoraba que
//   si el marcador es 0-2, el 3er set ya es decisivo para el
//   jugador que va perdiendo.
//
// SOLUCIÓN ORIGINAL (v2, luego superada):
//   Presión proporcional a los sets ganados por el rival:
//   pressP1 = rivalSets / 3  (0→0, 1→0.33, 2→0.67, final→1.0)
//   bonus = (dec_win − 0.64) × 0.06 × presión
//   Aplicado asimétricamente: solo le cuesta al que va perdiendo.
//
// ─────────────────────────────────────────────────────────────
// FIX C — Surface bias en rally distribution  (v3)
// ─────────────────────────────────────────────────────────────
// PROBLEMA DETECTADO:
//   El motor promediaba ciegamente los perfiles de rally de
//   ambos jugadores. Nadal (34/33/33) vs Kyrgios (46/31/23)
//   daba automáticamente 40/32/28, dejando que Kyrgios
//   "robara" 5pp de rallies largos a Nadal sin ninguna batalla
//   táctica. La ventaja táctica de Nadal era invisible.
//   Adicionalmente, el motor no reflejaba que en clay hay
//   más rallies largos que en hierba independientemente del
//   estilo de los jugadores.
//
// SOLUCIÓN:
//   Shifts absolutos de superficie ANTES de normalizar,
//   basados en datos ATP reales (Brain Game Tennis / Mattspoint):
//     Clay:  short −8pp, mid +2pp, long +6pp
//     Hard:  sin cambio (superficie de referencia)
//     Grass: short +8pp, mid +1pp, long −9pp
//
// ─────────────────────────────────────────────────────────────
// FIX D — Server vulnerability en rallies largos  (v3/v4)
// ─────────────────────────────────────────────────────────────
// PROBLEMA DETECTADO:
//   Cuando el partido produce más rallies largos que el perfil
//   natural del servidor, este está "fuera de zona". Su tasa
//   de errores real sube. Ivanisevic en clay vs Nadal debería
//   cometer muchos más errores pero el motor le daba la misma
//   probabilidad.
//
// SOLUCIÓN:
//   displacement = max(0, actualLongPct − naturalLong)
//   effectiveErrors = baseErrors × (1 + displacement × 4.5)
//   vuln = (effectiveErrors − AVG_ERRORS) / AVG_ERRORS × 0.062
//   Solo fires cuando actualLong > naturalLong (asimétrico).
//
//   En v4 se añadió net_win attenuation: los jugadores con
//   alto net_win (Federer 0.72, Sampras 0.78) pueden acortar
//   los rallies subiendo a la red, reduciendo su desplazamiento:
//   netAtten = min(0.60, (net_win − 0.65) × 5.0)
//   dispEff  = dispRaw × (1 − netAtten)
//
// ─────────────────────────────────────────────────────────────
// FIX F — Calibración de superficie diferenciada  (v5)
// ─────────────────────────────────────────────────────────────
// PROBLEMA DETECTADO:
//   Una constante global k=0.55 amortiguaba igual los surface
//   modifiers en las tres superficies. En hard esto generaba
//   gaps excesivos: Djokovic (hard=1.08) vs Nadal (hard=0.98)
//   producía un gap de pWin de 0.058 en hard, haciendo casi
//   imposible que Nadal remontara en pista dura (motor daba
//   14.8% vs real 48% contra Djokovic).
//
// ANÁLISIS:
//   Hard es la superficie más pareja del circuito — nadie la
//   domina como Nadal domina la arcilla. Comprimir más los
//   modifiers de hard es más fiel a la realidad del circuito.
//   Grid search sobre 11 H2H de referencia (N=3000 c/u):
//   k global 0.55 → error total 136pp
//   k diferenciado  → error total 124pp (−9%)
//
// SOLUCIÓN:
//   SURF_CAL_HARD  = 0.35  (máxima compresión — hard más parejo)
//   SURF_CAL_CLAY  = 0.55  (sin cambio — spread de clay es real)
//   SURF_CAL_GRASS = 0.55  (conservador — pocos datos H2H en hierba)
//
//   Mejoras clave: Nadal-Djokovic hard +6pp; Nadal-Federer hard +4pp;
//   Alcaraz-Sinner hard +3pp; Roddick-Federer hard +2pp.
//
// ─────────────────────────────────────────────────────────────
// FIX G — comeback stat reemplaza dec_win  (v6)
// ─────────────────────────────────────────────────────────────
// PROBLEMA DETECTADO:
//   dec_win como proxy de resiliencia tenía correlación 0.53 con
//   el comeback% real medido en la BD. El gap Djokovic(0.74)–
//   Monfils(0.62) generaba solo 0.0048pp de diferencia en pWin
//   (1% del gap real de 39pp de comeback%). El multiplicador K=0.06
//   era insuficiente, y subir K con dec_win amplificaba señales
//   incorrectas (Murray y Sinner tienen el mismo dec_win que
//   Nadal pero comeback% muy diferente en la BD).
//
// METODOLOGÍA:
//   Se calculó el comeback% real (P(ganar partido | perdiste el
//   set anterior)) para los 104 jugadores usando la BD 2003-2025.
//   84 jugadores tenían suficientes partidos Bo5 para ser fiables.
//   Para el resto se usó regresión lineal dec_win → comeback.
//
//   Blending por nivel de confianza:
//   n >= 15 Bo5: 80% dato real BD + 20% estimación por regresión
//   n =  8-14:   50% dato real BD + 50% estimación por regresión
//   n <  8:      100% estimación por regresión (dec_win)
//
//   Media del campo: AVG_COMEBACK = 0.250
//   Rango: 0.05 (Larsson, Blake) a 0.50 (Alcaraz)
//
// FÓRMULA (misma estructura asimétrica que Fix B):
//   presión = setsRival / 3  (0→0, 1→0.33, 2→0.67, final→1.0)
//   bonus = (comeback − AVG_COMEBACK) × K_COMEBACK × presión
//   K_COMEBACK = 0.04 (calibrado por grid search)
//
//   El valor K=0.04 fue elegido tras probar K=0.04 a 0.20.
//   K más alto mejoraba algunos matchups pero disparaba otros
//   (Nadal-Monfils clay pasaba de 94% a 98% con K=0.10).
//   K=0.04 minimiza el error total sobre 10 H2H de referencia.
//
//   Impacto a presión máxima (0-2 en sets):
//   Djokovic (0.48): +0.0092pp  |  Monfils  (0.12): −0.0052pp
//   Nadal    (0.45): +0.0080pp  |  Gasquet  (0.14): −0.0044pp
//   Federer  (0.40): +0.0060pp  |  Berrettini(0.16):−0.0036pp
//   Gap Djokovic–Monfils: 0.0144pp (vs 0.0048pp antes = 3×)
//
// —————————————————————————————————————————————————————————————
// FIX M2 — pressure_index en puntos grandes del juego  (v7)
// —————————————————————————————————————————————————————————————
// PROBLEMA DETECTADO:
//   El motor trataba igual un punto "normal" que un 30-30, un
//   deuce o un break point. Eso hacía que jugadores de presión
//   sostenida (Djokovic, Nadal, Murray) no exprimieran del todo
//   su ventaja estructural en los momentos críticos del juego.
//   El sesgo se veía especialmente contra pegadores inflados:
//   Del Potro, Cilic o Roddick seguían sosteniendo demasiados
//   juegos apretados incluso frente a restadores de élite.
//
// SOLUCIÓN:
//   Se introduce pressure_index_100 como señal de "capacidad de
//   apretar" en puntos grandes. Si el jugador trae un modelo
//   enriquecido (players_v3) se usa directamente; si no, se
//   estima desde los stats legacy:
//
//   pressure ≈ returnWin*60 + breakConvert*40 + rally_long/2.5
//
//   El ajuste solo actúa en puntos de presión:
//   - 30-30  → neutral big point
//   - deuce / ventaja
//   - break points contra el servidor
//   - puntos de hold importantes
//
//   Calibración final elegida ("M2 calibrado"):
//   deuceCoef   = 0.010
//   breakCoef   = 0.014
//   holdCoef    = 0.006
//   neutralCoef = 0.004
//
// RESULTADO EXPERIMENTAL:
//   Sobre el basket de referencia, esta versión redujo el error
//   agregado ~20pp frente al baseline. Mejoró especialmente:
//   Nadal-Roddick clay, Djokovic-Del Potro hard, Djokovic-Cilic
//   hard y Federer-Wawrinka hard, sin reescribir la estructura
//   completa del rally ni introducir doble contabilidad fuerte.
//
// ─────────────────────────────────────────────────────────────
// FIXES ESTUDIADOS Y DESCARTADOS
// ─────────────────────────────────────────────────────────────
// FIX E — Error penalty en rallies cortos/medios
//   Descartado: el mecanismo era correcto (los errores en rallies
//   cortos son invisibles al motor) pero cualquier implementación
//   empeoraba el error total H2H. La causa: los errores en
//   players.js están correlacionados positivamente con win1st
//   (r=0.60) — los jugadores agresivos tienen más errores Y mejor
//   saque. Penalizar errores sin considerar esa correlación
//   creaba doble contabilidad inversa.
//
// Ajuste surface modifiers players.js por BD
//   Descartado: intentar calibrar los modifiers individualmente
//   usando ratios de win% por superficie en la BD empeoró el
//   error total H2H con cualquier blend (0% a 60%). El sistema
//   está acoplado — cambiar el modifier de un jugador afecta
//   todos sus matchups, no solo el de la superficie objetivo.
//
// Bonus por GS en superficie ("aura")
//   Descartado: correlación entre GS y residual más allá del
//   modifier = −0.36 (negativa). El surface modifier ya captura
//   el aura. La prima adicional tiene base estadística nula
//   (Wilander clay n=23, Murray grass n=65 con partidos muy
//   selectivos contra top).
//
// ─────────────────────────────────────────────────────────────
// LÍMITES ESTRUCTURALES CONOCIDOS
// ─────────────────────────────────────────────────────────────
// Nadal-Djokovic hard (motor ~19%, real 48%):
//   El gap viene del baseServe: Djokovic 0.692 vs Nadal 0.672.
//   Esta diferencia refleja datos ATP reales (win1st, win2nd)
//   y no puede corregirse sin falsificar stats. Con Fix F se
//   redujo de −33pp a −28pp; el residual es irreducible con la
//   arquitectura Markov actual.
//
// Ranking all-vs-all no comparable entre eras:
//   Lendl, Courier, Ferrer caen en rankings matriciales porque
//   se les enfrenta 300 veces a Djokovic y Alcaraz — partidos
//   que nunca ocurrieron. El motor es válido para simular
//   matchups entre jugadores; el ranking global inter-era es
//   una comparativa especulativa, no una métrica de calibración.
//
// ============================================================

// FIX F — Calibración de superficie diferenciada por superficie
const SURF_CAL_HARD  = 0.35; // hard: superficie más pareja del circuito
const SURF_CAL_CLAY  = 0.55; // clay: spread real, sin comprimir más
const SURF_CAL_GRASS = 0.55; // grass: conservador, pocos H2H de referencia

// FIX A — Return pressure relativo a la media del campo
// La media se calcula una vez del array PLAYERS (lazy init)
let _avgReturnWin = null;
function getAvgReturnWin() {
  if (_avgReturnWin === null) {
    _avgReturnWin = (typeof PLAYERS !== 'undefined' && PLAYERS.length)
      ? PLAYERS.reduce((s, p) => s + p.stats.returnWin, 0) / PLAYERS.length
      : 0.426;
  }
  return _avgReturnWin;
}

// calibratedSurf: aplica el factor de amortiguación correcto según superficie
function calibratedSurf(player, surface) {
  const raw = player.stats.surface[surface] || 1.0;
  const k   = surface === 'clay'  ? SURF_CAL_CLAY
             : surface === 'grass' ? SURF_CAL_GRASS
             :                       SURF_CAL_HARD;
  return 1.0 + (raw - 1.0) * k;
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ============================================================
// FIX C — Rally distribution con sesgo de superficie real
// ============================================================
// Shifts absolutos aplicados ANTES de normalizar el perfil de rally.
// Reflejan datos reales ATP: clay = 4.3 golpes/punto (los más largos),
// hard = 3.8 (referencia), grass = 3.4 (los más cortos).
// Se aplican al promedio de los perfiles de ambos jugadores para que
// la superficie domine sobre el estilo individual cuando corresponde.
const SURFACE_BIAS = {
  clay:  { short: -8, mid: +2, long: +6 },
  hard:  { short:  0, mid:  0, long:  0 },
  grass: { short: +8, mid: +1, long: -9 }
};

function getRallyProfile(p1, p2, surface) {
  const s1 = p1.stats, s2 = p2.stats;

  // Promedio de perfiles de los dos jugadores
  let short = (s1.rally_short + s2.rally_short) / 2;
  let mid   = (s1.rally_mid   + s2.rally_mid)   / 2;
  let long  = (s1.rally_long  + s2.rally_long)  / 2;

  // Sesgo de superficie (Fix C)
  const bias = SURFACE_BIAS[surface] || SURFACE_BIAS.hard;
  short += bias.short;
  mid   += bias.mid;
  long  += bias.long;

  // Clamp para evitar negativos y renormalizar a 100%
  short = Math.max(short, 5);
  mid   = Math.max(mid,   5);
  long  = Math.max(long,  5);
  const total = short + mid + long;

  return { short: short/total, mid: mid/total, long: long/total };
}

// ============================================================
// FIX D — Server vulnerability por desplazamiento de errores
// ============================================================
// Cuando el partido tiene más rallies largos que el perfil natural
// del servidor, este está "fuera de zona" y sus errores aumentan.
// Solo penaliza al servidor (asimétrico): en superficies rápidas,
// el saque ya penaliza a los defensivos automáticamente.
//
// La atenuación por net_win (v4) permite que los voladores natos
// (Federer, Sampras, Edberg) reduzcan su desplazamiento subiendo
// a la red — lo que en la realidad hacen constantemente.
const AVG_ERRORS_PER_SET = 26;   // media del campo en players.js
const K_DISPLACEMENT     = 4.5;  // escalado del efecto de desplazamiento
const FACTOR_V           = 0.062; // convierte error extra en penalización pWin
const AVG_NET_WIN        = 0.65;  // media del campo net_win
const FACTOR_N           = 5.0;   // fuerza de atenuación por subida a red

// FIX M2 — presión en puntos grandes
const DEUCE_PRESSURE_COEF   = 0.010;
const BREAK_PRESSURE_COEF   = 0.014;
const HOLD_PRESSURE_COEF    = 0.006;
const NEUTRAL_PRESSURE_COEF = 0.004;

// FIX G — Modelo de comeback por superficie
// La media se calcula lazy desde players.js para respetar el blend actual
// jugador + era/superficie + superficie global.
const K_COMEBACK    = 0.04;
let _avgComebackSurface = null;
const GAME_RESILIENCE_COEF = 0.010;
const GAME_CONTROL_COEF = 0.000;
const SET_CLOSE_HARD_COEF = 0.004;
const DEFAULT_GAME_RESILIENCE_100 = 50;
const DEFAULT_GAME_CONTROL_100 = 50;
const DEFAULT_SET_CONTROL_100 = 50;

function getAvgComebackSurface(surface) {
  if (_avgComebackSurface === null) {
    _avgComebackSurface = { hard: 0.25, clay: 0.25, grass: 0.25 };
    if (typeof PLAYERS !== 'undefined' && PLAYERS.length) {
      for (const key of Object.keys(_avgComebackSurface)) {
        _avgComebackSurface[key] = PLAYERS.reduce((sum, player) => {
          const surfaceValue = player.comeback_surface?.[key];
          return sum + (typeof surfaceValue === 'number' ? surfaceValue : (player.comeback || 0.25));
        }, 0) / PLAYERS.length;
      }
    }
  }
  return _avgComebackSurface[surface] || 0.25;
}

function getPlayerComeback(player, surface) {
  return player.comeback_surface?.[surface] || player.comeback || getAvgComebackSurface(surface);
}

function getAvgGameResilience() {
  return (typeof window !== 'undefined' && window.PLAYER_GAME_RESILIENCE?.average_game_resilience_100)
    || DEFAULT_GAME_RESILIENCE_100;
}

function getPlayerGameResilience(player) {
  if (typeof window !== 'undefined' && window.PLAYER_GAME_RESILIENCE_BY_ID) {
    const external = window.PLAYER_GAME_RESILIENCE_BY_ID[player.id];
    if (external && typeof external.game_resilience_100 === 'number') {
      return external.game_resilience_100;
    }
  }

  const pressure = getPressureIndex(player);
  const comeback =
    player.comeback_surface
      ? (['hard', 'clay', 'grass']
          .map((key) => player.comeback_surface?.[key])
          .filter((value) => typeof value === 'number')
          .reduce((sum, value, _index, arr) => sum + value / arr.length, 0))
      : (player.comeback || 0.25);

  return clamp(
    DEFAULT_GAME_RESILIENCE_100
      + (comeback - 0.25) * 120
      + (pressure - 50) * 0.18,
    25,
    80
  );
}

function getAvgGameControl() {
  return (typeof window !== 'undefined' && window.PLAYER_GAME_CONTROL?.average_game_control_100)
    || DEFAULT_GAME_CONTROL_100;
}

function getPlayerGameControl(player) {
  if (typeof window !== 'undefined' && window.PLAYER_GAME_CONTROL_BY_ID) {
    const external = window.PLAYER_GAME_CONTROL_BY_ID[player.id];
    if (external && typeof external.game_control_100 === 'number') {
      return external.game_control_100;
    }
  }

  const pressure = getPressureIndex(player);
  const stats = player.stats || {};
  const baseServe = (stats.serve1pct || 0.61) * (stats.win1st || 0.74)
    + (1 - (stats.serve1pct || 0.61)) * (stats.win2nd || 0.54);

  return clamp(
    DEFAULT_GAME_CONTROL_100
      + ((player.tb_win || 0.62) - 0.62) * 110
      + (baseServe - 0.645) * 180
      + (pressure - 50) * 0.12,
    25,
    80
  );
}

function getPlayerSetControlSurface(player, surface) {
  if (typeof window !== 'undefined' && window.PLAYER_SET_CONTROL_SURFACE_BY_ID) {
    const external = window.PLAYER_SET_CONTROL_SURFACE_BY_ID[player.id];
    const surfaceRow = external?.surfaces?.[surface];
    if (surfaceRow) return surfaceRow;
  }
  return null;
}

function empiricalSetControlWeight(surfaceRow) {
  if (!surfaceRow) return 0;
  const minCases = Math.min(surfaceRow.breakLeadSets || 0, surfaceRow.twoGameLeadSets || 0);
  if (minCases >= 25) return 1;
  if (minCases >= 10) return 0.65;
  if (minCases >= 1) return 0.3;
  return 0;
}

function getSetCloseControl100(player, surface) {
  const surfaceRow = getPlayerSetControlSurface(player, surface);
  if (surfaceRow && typeof surfaceRow.setControlSurface100 === 'number') {
    return surfaceRow.setControlSurface100;
  }
  return DEFAULT_SET_CONTROL_100;
}

function getSetCloseConfidence(player, surface) {
  return empiricalSetControlWeight(getPlayerSetControlSurface(player, surface));
}

function shouldApplySetClosePilot(surface, games) {
  if (surface !== 'hard') return false;
  const maxGames = Math.max(games[0], games[1]);
  return maxGames >= 4;
}

function setClosePressure(games, serverIndex, returnerIndex) {
  const serverGames = games[serverIndex];
  const returnerGames = games[returnerIndex];
  if (serverGames >= 5 && serverGames - returnerGames >= 1) return 1.0;
  if (returnerGames >= 5 && returnerGames - serverGames >= 1) return -1.0;
  if (serverGames >= 4 && serverGames - returnerGames >= 1) return 0.6;
  if (returnerGames >= 4 && returnerGames - serverGames >= 1) return -0.6;
  return 0;
}

function streakPressure(lostStreak) {
  if (lostStreak < 2) return 0;
  if (lostStreak === 2) return 0.6;
  if (lostStreak === 3) return 1.0;
  return 1.2;
}

function streakControl(winStreak) {
  if (winStreak < 2) return 0;
  if (winStreak === 2) return 0.5;
  if (winStreak === 3) return 0.85;
  return 1.05;
}

function getPressureIndex(player) {
  const model = player.model || {};
  const stats = player.stats || player;
  if (typeof model.pressure_index_100 === 'number') {
    return model.pressure_index_100;
  }
  return (stats.returnWin || 0.42) * 60
       + (stats.breakConvert || 0.42) * 40
       + (stats.rally_long || 26) / 2.5;
}

function getShotEfficiencyEdge(player) {
  const stats = player.stats || player;
  const winners = stats.winners || 34;
  const errors = Math.max(stats.errors || 22, 1);
  const ratio = winners / errors;
  const avgRatio = 1.5;
  return clamp((ratio - avgRatio) * 0.02, -0.02, 0.02);
}

function serverVulnerability(server, actualLongPct) {
  const sS    = server.stats || server;
  const netWin = server.net_win || AVG_NET_WIN;

  // Cuánto puede recortar el servidor los rallies largos subiendo a la red
  const netAttenuation = Math.min(0.60, Math.max(0, netWin - AVG_NET_WIN) * FACTOR_N);

  const naturalLong = sS.rally_long / 100;
  const dispRaw     = Math.max(0, actualLongPct - naturalLong); // solo penaliza, nunca bonifica
  const dispEff     = dispRaw * (1 - netAttenuation);

  const effectiveErrors = sS.errors * (1 + dispEff * K_DISPLACEMENT);
  return (effectiveErrors - AVG_ERRORS_PER_SET) / AVG_ERRORS_PER_SET * FACTOR_V;
}

// ============================================================
// calcWinProbServe — probabilidad base de ganar un juego al saque
// ============================================================
// Combina: baseServe (dato ATP real de win1st/win2nd) × sMod (superficie)
// + bonuses menores (velocidad saque, potencia, rally_short, red)
// − presión del returner (Fix A: relativa a la media del campo)
// Resultado clamped entre 0.40 y 0.75 para que ningún saque sea
// imbatible ni ningún retorno sea abrumador.
function calcWinProbServe(server, returner, surface) {
  const sS = server.stats, rS = returner.stats;

  const sMod = calibratedSurf(server, surface);
  const rMod = calibratedSurf(returner, surface);

  // Efectividad real al saque (datos ATP)
  const baseServe = sS.serve1pct * sS.win1st + (1 - sS.serve1pct) * sS.win2nd;

  // Bonuses secundarios: velocidad, potencia de golpes, perfil de rally corto, red
  const serveSpeedBonus       = ((sS.serve_kmh || 205) - 175) / 75 * 0.00;
  const serverPower           = (((sS.fh_kmh||148) + (sS.bh_kmh||138)) / 2 - 120) / 55 * 0.02;
  const serverShortRallyBonus = ((sS.rally_short||40) - 38) / 100 * 0.00;
  const netBonus              = ((server.net_win || 0.65) - 0.65) * 0.00;

  // FIX A: presión del returner relativa a la media del campo
  const returnSpeedFactor = ((rS.rest_kmh||148) - 125) / 40 * 0.02;
  const returnRelative    = (rS.returnWin - getAvgReturnWin()) * rMod;
  const returnPressure    = returnRelative * 0.30 + returnSpeedFactor * 0.5;

  const prob = (baseServe * sMod) + serveSpeedBonus + serverPower * 0.0
               + serverShortRallyBonus + netBonus - returnPressure;
  return clamp(prob, 0.40, 0.75);
}

function simPoint(pWin) { return Math.random() < pWin; }

// ============================================================
// simGame — simulación punto a punto dentro de un juego
// ============================================================
// Cada punto se clasifica como corto / medio / largo según el
// perfil de rally del partido. En cada categoría el pWin base
// se ajusta de forma distinta:
//   Corto:  el saque domina más (+0.04), la velocidad de devolución
//           reduce ese dominio
//   Medio:  ventaja del saque se atenúa ligeramente (−0.01)
//   Largo:  returner toma control (−0.06 base) + longRallySkill
//           + potencia de groundstrokes + Fix D (server vulnerability)
function simGame(pWin, rallyProf, server, returner, isFinal) {
  const sS = server.stats || server;
  const rS = returner.stats || returner;
  const serverPressure = getPressureIndex(server);
  const returnerPressure = getPressureIndex(returner);
  const shotEdge = getShotEfficiencyEdge(server) - getShotEfficiencyEdge(returner);
  const pressureEdgeRaw = (returnerPressure - serverPressure) / 20;
  let pts = [0, 0];
  while (true) {
    const r = Math.random();
    let pw;
    if (r < rallyProf.short) {
      // Rally corto: el saque domina, la velocidad de devolución lo modera
      const returnSpeedAdj = ((rS.rest_kmh||148) - 148) / 40 * 0.04;
      pw = clamp(pWin + 0.04 - returnSpeedAdj, 0.38, 0.80);

    } else if (r < rallyProf.short + rallyProf.mid) {
      // Rally medio: ventaja del saque se desvanece
      pw = clamp(pWin - 0.01 + shotEdge * 0.4, 0.38, 0.75);

    } else {
      // Rally largo: el returner toma el control
      // longRallySkill: habilidad del RETURNER en intercambios largos
      const longRallySkill = ((rS.rally_long||26) - 26) / 34 * 0.06;
      // groundAdv: ventaja de potencia del returner en el fondo
      const groundAdv      = (((rS.fh_kmh||148) + (rS.bh_kmh||138)) / 2 - 143) / 35 * 0.03;
      // Fix D: vulnerabilidad del servidor cuando el partido se alarga más de lo natural
      const vuln = serverVulnerability(server, rallyProf.long);

      pw = clamp(pWin - 0.06 - longRallySkill - groundAdv - vuln + shotEdge * 0.3, 0.28, 0.70);
    }

    // FIX M2 — puntos de presión dentro del juego.
    // El restador con mayor pressure_index aprieta más en deuce,
    // break points y 30-30; el servidor con buen pressure_index
    // amortigua mejor esos momentos.
    let pressureAdj = 0;
    const deuceLike = pts[0] >= 3 && pts[1] >= 3;
    const serverPressurePoint = pts[1] >= 3 && pts[1] - pts[0] >= 0;
    const returnerPressurePoint = pts[0] >= 3 && pts[0] - pts[1] >= 0;
    const neutralBigPoint = (pts[0] === 2 && pts[1] === 2);

    if (deuceLike) {
      pressureAdj -= pressureEdgeRaw * DEUCE_PRESSURE_COEF;
    } else if (serverPressurePoint) {
      pressureAdj -= pressureEdgeRaw * BREAK_PRESSURE_COEF;
    } else if (returnerPressurePoint) {
      pressureAdj -= pressureEdgeRaw * HOLD_PRESSURE_COEF;
    } else if (neutralBigPoint) {
      pressureAdj -= pressureEdgeRaw * NEUTRAL_PRESSURE_COEF;
    }

    pw = clamp(pw + pressureAdj, 0.28, 0.80);

    if (simPoint(pw)) pts[0]++; else pts[1]++;
    if (pts[0] >= 4 && pts[0] - pts[1] >= 2) return 0;
    if (pts[1] >= 4 && pts[1] - pts[0] >= 2) return 1;
  }
}

// simTiebreak: tb_win ajusta el pWin en el tiebreak
// Djokovic (tb_win=0.72) vs media del campo (0.62) = +0.008pp de ventaja
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

// ============================================================
// simSet — simulación de un set completo
// ============================================================
// Aplica Fix G (comeback) calculando el bonus de presión para
// cada jugador según cuántos sets lleva perdiendo.
// La presión es asimétrica: solo afecta al que va por detrás.
function simSet(p1, p2, surface, isFinal, useTb, firstServer, sets) {
  let games = [0, 0], gameCount = 0, gameLog = [];
  let rallyStats = { short: 0, mid: 0, long: 0 };
  const rallyProf = getRallyProfile(p1, p2, surface);
  const gameResilienceAvg = getAvgGameResilience();
  const gameControlAvg = getAvgGameControl();
  const p1GameResilience = getPlayerGameResilience(p1);
  const p2GameResilience = getPlayerGameResilience(p2);
  const p1GameControl = getPlayerGameControl(p1);
  const p2GameControl = getPlayerGameControl(p2);
  const p1SetCloseHard = getSetCloseControl100(p1, surface);
  const p2SetCloseHard = getSetCloseControl100(p2, surface);
  const p1SetCloseConfidence = getSetCloseConfidence(p1, surface);
  const p2SetCloseConfidence = getSetCloseConfidence(p2, surface);
  let lostStreaks = [0, 0];
  let wonStreaks = [0, 0];

  // FIX G — Presión por marcador usando comeback stat (reemplaza Fix B)
  // presión = sets perdidos por el jugador / 3
  // (0-0: sin presión, 0-1: 0.33, 0-2: 0.67, set final: 1.0)
  const rivalSetsP1 = sets ? sets[1] : (isFinal ? 2 : 0);
  const rivalSetsP2 = sets ? sets[0] : (isFinal ? 2 : 0);
  const pressP1 = rivalSetsP1 / 3;
  const pressP2 = rivalSetsP2 / 3;
  const avgComeback = getAvgComebackSurface(surface);
  const p1ComebackBonus = (getPlayerComeback(p1, surface) - avgComeback) * K_COMEBACK * pressP1;
  const p2ComebackBonus = (getPlayerComeback(p2, surface) - avgComeback) * K_COMEBACK * pressP2;

  while (true) {
    const serving  = (firstServer + gameCount) % 2;
    const server   = serving === 0 ? p1 : p2;
    const returner = serving === 0 ? p2 : p1;
    const basePSrv = calcWinProbServe(server, returner, surface);
    // El bonus se aplica asimétricamente: quien va perdiendo recibe su bonus,
    // quien va ganando recibe el bonus del otro como penalización neta
    const decBonus = serving === 0 ? p1ComebackBonus - p2ComebackBonus : p2ComebackBonus - p1ComebackBonus;
    const serverIndex = serving;
    const returnerIndex = 1 - serving;
    const serverResilienceEdge = (serverIndex === 0 ? p1GameResilience : p2GameResilience) - gameResilienceAvg;
    const returnerResilienceEdge = (returnerIndex === 0 ? p1GameResilience : p2GameResilience) - gameResilienceAvg;
    const serverControlEdge = (serverIndex === 0 ? p1GameControl : p2GameControl) - gameControlAvg;
    const returnerControlEdge = (returnerIndex === 0 ? p1GameControl : p2GameControl) - gameControlAvg;
    const gameResilienceAdj =
      (serverResilienceEdge / 100) * GAME_RESILIENCE_COEF * streakPressure(lostStreaks[serverIndex])
      - (returnerResilienceEdge / 100) * GAME_RESILIENCE_COEF * streakPressure(lostStreaks[returnerIndex]);
    const gameControlAdj =
      (serverControlEdge / 100) * GAME_CONTROL_COEF * streakControl(wonStreaks[serverIndex])
      - (returnerControlEdge / 100) * GAME_CONTROL_COEF * streakControl(wonStreaks[returnerIndex]);
    let setCloseAdj = 0;
    if (shouldApplySetClosePilot(surface, games)) {
      const scorePressure = setClosePressure(games, serverIndex, returnerIndex);
      const serverSetCloseEdge = ((serverIndex === 0 ? p1SetCloseHard : p2SetCloseHard) - DEFAULT_SET_CONTROL_100) / 100;
      const returnerSetCloseEdge = ((returnerIndex === 0 ? p1SetCloseHard : p2SetCloseHard) - DEFAULT_SET_CONTROL_100) / 100;
      const serverConfidence = serverIndex === 0 ? p1SetCloseConfidence : p2SetCloseConfidence;
      const returnerConfidence = returnerIndex === 0 ? p1SetCloseConfidence : p2SetCloseConfidence;
      setCloseAdj =
        scorePressure * serverSetCloseEdge * serverConfidence * SET_CLOSE_HARD_COEF
        - scorePressure * returnerSetCloseEdge * returnerConfidence * SET_CLOSE_HARD_COEF;
    }
    const pSrv     = clamp(basePSrv + decBonus + gameResilienceAdj + gameControlAdj + setCloseAdj, 0.38, 0.78);

    if (games[0] === 6 && games[1] === 6) {
      if (useTb) {
        const tbW = simTiebreak(pSrv, server, returner);
        const gw  = tbW === 0 ? serving : 1 - serving;
        games[gw]++; gameCount++;
        gameLog.push({ serving, score: [...games], tb: true });
        lostStreaks[gw] = 0;
        lostStreaks[1 - gw] += 1;
        wonStreaks[gw] += 1;
        wonStreaks[1 - gw] = 0;
        break;
      } else {
        const gwGame = simGame(pSrv, rallyProf, server, returner, isFinal);
        const gw     = gwGame === 0 ? serving : 1 - serving;
        games[gw]++; gameCount++;
        gameLog.push({ serving, score: [...games] });
        lostStreaks[gw] = 0;
        lostStreaks[1 - gw] += 1;
        wonStreaks[gw] += 1;
        wonStreaks[1 - gw] = 0;
        if (Math.abs(games[0] - games[1]) >= 2) break;
      }
    } else {
      const gwGame = simGame(pSrv, rallyProf, server, returner, isFinal);
      const gw     = gwGame === 0 ? serving : 1 - serving;
      games[gw]++; gameCount++;
      gameLog.push({ serving, score: [...games] });
      lostStreaks[gw] = 0;
      lostStreaks[1 - gw] += 1;
      wonStreaks[gw] += 1;
      wonStreaks[1 - gw] = 0;
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

// simMatch: orquesta sets hasta que alguien alcanza setsNeeded
// firstServer aleatorio; la alternancia de servicio es automática
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

const TENNIS_ENGINE = {
  calibratedSurf,
  clamp,
  getRallyProfile,
  calcWinProbServe,
  simPoint,
  simGame,
  simTiebreak,
  simSet,
  simMatch
};

if (typeof globalThis !== 'undefined') {
  globalThis.TENNIS_ENGINE = TENNIS_ENGINE;
}
if (typeof window !== 'undefined') {
  window.TENNIS_ENGINE = TENNIS_ENGINE;
}

// ============================================================
// PARTICLES — efecto visual en la UI (no afecta la simulación)
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
