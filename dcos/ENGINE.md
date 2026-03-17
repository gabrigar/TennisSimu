# TennisSimu — Documentación del Motor y Calibración

**Proyecto:** [gabrigar.github.io/TennisSimu](https://gabrigar.github.io/TennisSimu/)  
**Versión motor:** v6  
**Última calibración:** marzo 2026  
**Base de datos:** 9.561 partidos reales (1985–2025) entre 104 jugadores históricos

---

## Índice

1. [Arquitectura del motor](#1-arquitectura-del-motor)
2. [Stats de los jugadores](#2-stats-de-los-jugadores)
3. [Fórmulas activas](#3-fórmulas-activas)
4. [Historial de fixes](#4-historial-de-fixes)
5. [Fixes estudiados y descartados](#5-fixes-estudiados-y-descartados)
6. [Límites estructurales conocidos](#6-límites-estructurales-conocidos)
7. [Metodología de calibración](#7-metodología-de-calibración)
8. [Herramientas de análisis generadas](#8-herramientas-de-análisis-generadas)
9. [Ideas para secciones de la web](#9-ideas-para-secciones-de-la-web)

---

## 1. Arquitectura del motor

El motor es un **simulador Markov punto a punto**. Cada partido se descompone en:

```
simMatch → simSet (×n) → simGame (×12 aprox) → simPoint (×4-7 aprox)
```

El flujo básico por juego:

1. Calcular `pWin` base del servidor con `calcWinProbServe(server, returner, surface)`
2. Ajustar `pWin` por presión del marcador (Fix G — comeback)
3. Para cada punto, clasificarlo como rally corto / medio / largo según `getRallyProfile`
4. Ajustar `pWin` según el tipo de rally (Fix C + Fix D)
5. Simular el punto: `Math.random() < pWin`

**La probabilidad de ganar un punto al saque (`pWin`) está clamped entre 0.40 y 0.75.**  
Esto evita que ningún saque sea absolutamente imbatible ni ningún retorno aplastante.

---

## 2. Stats de los jugadores

Cada jugador tiene **16 stats activos** en el motor, más 3 stats de contexto no usados en fórmulas.

### Stats en `player.stats.*`

| Stat | Rango campo | Descripción | Tipo dato |
|------|-------------|-------------|-----------|
| `serve1pct` | 0.58–0.68 | % 1er servicios dentro | real ATP |
| `win1st` | 0.70–0.84 | % puntos ganados con 1er servicio | real ATP |
| `win2nd` | 0.46–0.60 | % puntos ganados con 2º servicio | real ATP |
| `returnWin` | 0.28–0.50 | % puntos ganados al devolver | real ATP |
| `serve_kmh` | 180–249 | Velocidad **máxima** del 1er servicio | estimado |
| `fh_kmh` | 135–168 | Velocidad de la derecha | estimado |
| `bh_kmh` | 122–158 | Velocidad del revés | estimado |
| `rest_kmh` | 130–165 | Velocidad de la devolución | estimado |
| `errors` | 17–38 | Errores no forzados por set | estimado |
| `winners` | 26–52 | Winners por set *(no activo en fórmulas)* | estimado |
| `rally_short` | 30–52% | % puntos en ≤3 golpes | estimado |
| `rally_mid` | 29–38% | % puntos en 4–7 golpes | estimado |
| `rally_long` | 19–34% | % puntos en 8+ golpes | estimado |
| `surface.hard` | 0.85–1.09 | Multiplicador de pista dura | estimado |
| `surface.clay` | 0.84–1.22 | Multiplicador de arcilla | estimado |
| `surface.grass` | 0.82–1.16 | Multiplicador de hierba | estimado |

### Stats en `player.*` (nivel raíz)

| Stat | Rango campo | Descripción |
|------|-------------|-------------|
| `tb_win` | 0.54–0.74 | % tiebreaks ganados |
| `dec_win` | 0.56–0.74 | % sets decisivos ganados *(proxy histórico, no activo en fórmulas desde v6)* |
| `comeback` | 0.05–0.50 | P(ganar partido \| perdiste el set anterior) — **nuevo en v6** |
| `net_win` | 0.52–0.82 | % puntos ganados en la red |

### Nota sobre `serve_kmh`

Todos los valores de `serve_kmh` representan la **velocidad máxima registrada**, no la media. Esto es coherente en todo el campo:
- Roddick: 249 km/h (récord ATP histórico)
- Djokovic: 235 km/h
- Federer: 230 km/h
- Nadal: 215 km/h (máximo registrado: 217 km/h, US Open 2010)

El `serveSpeedBonus` usa diferencias relativas entre jugadores, por lo que la convención uniforme no introduce sesgo en los matchups.

### Nota sobre `winners`

`winners` está registrado en `players.js` pero **no se usa en ninguna fórmula activa**. La razón: está altamente correlacionado con `fh_kmh`/`bh_kmh` (r≈0.60), y añadirlo crearía doble contabilidad con el `serverPower` ya incluido en `calcWinProbServe`.

### El stat `comeback` (nuevo en v6)

Derivado directamente de la base de datos de 9.561 partidos reales:

- **n ≥ 15 partidos Bo5:** 80% dato real de BD + 20% estimación por regresión
- **n = 8–14:** 50% real + 50% estimación
- **n < 8:** 100% estimación por regresión lineal desde `dec_win`

Regresión: `comeback_est = −1.1841 + 2.3067 × dec_win`

| Jugador | comeback | fuente | n Bo5 |
|---------|---------|--------|-------|
| Alcaraz | 0.50 | real (80%) | 15 |
| Djokovic | 0.48 | real (80%) | 64 |
| Lendl | 0.49 | real (80%) | 27 |
| Nadal | 0.45 | real (80%) | 50 |
| Sampras | 0.47 | real (80%) | 40 |
| Federer | 0.40 | real (80%) | 57 |
| Murray | 0.30 | real (80%) | 53 |
| Monfils | 0.12 | real (80%) | 35 |
| Gasquet | 0.14 | real (80%) | 50 |
| Berrettini | 0.16 | blend (50%) | 12 |

---

## 3. Fórmulas activas

### calcWinProbServe (pWin base)

```
baseServe    = serve1pct × win1st + (1 − serve1pct) × win2nd
sMod         = 1 + (surface[surf] − 1) × k_surf   ← k diferente por superficie (Fix F)

serveSpeed   = (serve_kmh − 175) / 75 × 0.03
serverPower  = ((fh_kmh + bh_kmh) / 2 − 120) / 55 × 0.02 × 0.5
shortBonus   = (rally_short − 38) / 100 × 0.015
netBonus     = (net_win − 0.65) × 0.04

retSpeed     = (rest_kmh − 125) / 40 × 0.02
retRelative  = (returnWin − avgFieldReturn) × rMod   ← Fix A
retPressure  = retRelative × 0.30 + retSpeed × 0.50

pWin = clamp(baseServe × sMod + serveSpeed + serverPower + shortBonus + netBonus − retPressure,
             0.40, 0.75)
```

### Surface calibration (Fix F)

```
k_hard  = 0.35   ← máxima compresión
k_clay  = 0.55
k_grass = 0.55
```

### Rally profile (Fix C)

```
short = (rally_short_p1 + rally_short_p2) / 2 + bias_surf.short
mid   = (rally_mid_p1   + rally_mid_p2)   / 2 + bias_surf.mid
long  = (rally_long_p1  + rally_long_p2)  / 2 + bias_surf.long
→ renormalizar a 100%

bias_clay  = {short: −8, mid: +2, long: +6}
bias_hard  = {short:  0, mid:  0, long:  0}
bias_grass = {short: +8, mid: +1, long: −9}
```

### Server vulnerability en rally largo (Fix D)

```
netAtten      = clamp((net_win − 0.65) × 5.0, 0, 0.60)
dispRaw       = max(0, actualLongPct − rally_long/100)
dispEff       = dispRaw × (1 − netAtten)
effectiveErr  = errors × (1 + dispEff × 4.5)
vuln          = (effectiveErr − 26) / 26 × 0.062

pw_long = clamp(pWin − 0.06 − longRallySkill − groundAdv − vuln, 0.28, 0.70)
```

### Presión por marcador (Fix G — comeback)

```
presión    = setsRival / 3
bonus      = (comeback − 0.250) × 0.04 × presión
pSrv_final = clamp(pWin + bonus_p1 − bonus_p2, 0.38, 0.78)
```

---

## 4. Historial de fixes

### Fix A — Return pressure relativo a la media del campo (v2)

**Problema:** la penalización original usaba `returnWin` absoluto × 0.15. La diferencia Djokovic (0.50) vs Sampras (0.34) era solo 0.024pp en `pWin`. El `serveSpeedBonus` de Roddick (0.030pp) la cancelaba completamente.

**Solución:** solo la parte que supera la media del campo (0.426) penaliza al servidor. Un returner promedio es neutro.

---

### Fix B — dec_win asimétrico (v2) → Superado por Fix G en v6

**Problema:** `dec_win` solo activaba en el set final con K=0.06. La diferencia Nadal-Kyrgios era 0.0036pp en `pWin`.

**Solución original:** presión proporcional al marcador: `(rivalSets/3) × (dec_win − 0.64) × 0.06`. Asimétrico: solo penaliza al que va perdiendo.

---

### Fix C — Surface bias en rally distribution (v3)

**Problema:** el motor promediaba ciegamente los perfiles de rally. Kyrgios "robaba" 5pp de rallies largos a Nadal sin batalla táctica. No había diferencia en duración de rallies entre clay y hierba.

**Solución:** shifts absolutos derivados de datos ATP reales antes de normalizar. Clay añade +6pp de rallies largos; hierba los reduce −9pp.

---

### Fix D — Server vulnerability en rallies largos (v3/v4)

**Problema:** Ivanisevic en clay vs Nadal debería cometer muchos errores al verse forzado a rallies largos, pero el motor no lo capturaba.

**Solución:** cuando el partido produce más rallies largos que el perfil natural del servidor, sus errores efectivos escalan. En v4 se añadió atenuación por `net_win`: Federer y Sampras pueden acortar esos rallies subiendo a la red.

---

### Fix F — Calibración de superficie diferenciada (v5)

**Problema:** k global = 0.55 para las tres superficies. En hard, el gap Djokovic (1.08) vs Nadal (0.98) generaba un gap de `pWin` de 0.058, haciendo que el motor diera 14.8% para Nadal vs Djokovic en hard (real: 48%).

**Descubrimiento clave:** hard es la superficie más pareja del circuito. Ningún jugador domina en hard como Nadal domina en clay. Comprimir más los modifiers de hard es más fiel a la realidad.

**Grid search:** 11 H2H de referencia, N=3000 cada uno. Ganador: kH=0.35, kC=0.55, kG=0.55.

| Matchup | Real | antes (k=0.55) | después |
|---------|------|---------------|---------|
| Nadal-Djokovic hard | 48% | 14.8% (−33pp) | 19.6% (−28pp) |
| Nadal-Federer hard | 49% | 33.1% (−16pp) | 37.7% (−12pp) |
| Alcaraz-Sinner hard | 61% | 50.3% (−11pp) | 53.5% (−8pp) |

---

### Fix G — comeback stat reemplaza dec_win (v6)

**Problema:** `dec_win` tenía correlación 0.53 con el comeback% real. El gap Djokovic-Monfils generaba 0.0048pp (1% del gap real de 39pp). Subir K con dec_win amplificaba señales incorrectas.

**Metodología:**  
Se calculó el `comeback%` = P(ganar partido | perdiste el set anterior) para los 104 jugadores usando 9.561 partidos reales. 84 jugadores tenían suficiente muestra Bo5. Se estableció un sistema de blending con tres niveles de confianza.

**Calibración:** grid search K = 0.04 a 0.20. K=0.04 minimiza el error sobre 10 H2H de referencia. K más alto mejoraba algunos matchups pero disparaba Nadal-Monfils clay de 94% a 98%.

**Resultado:** gap Djokovic-Monfils en pWin = 0.0144pp (3× más que antes).

---

## 5. Fixes estudiados y descartados

### Fix E — Error penalty en rallies cortos/medios

**Idea:** los errores no forzados son invisibles al motor en los rallies cortos y medios (65-70% de los puntos). Kyrgios (35 errores) debería ser penalizado ahí.

**Por qué se descartó:** en `players.js` la correlación `errors` vs `win1st` es +0.60 (positiva). Los jugadores más agresivos tienen más errores *y* mejor saque. Penalizar errores sin considerar esa correlación creaba doble contabilidad. El error total H2H aumentaba con cualquier implementación.

### Ajuste de surface modifiers por BD

**Idea:** recalibrar los modifiers de `players.js` usando los ratios de win% por superficie de la base de datos.

**Por qué se descartó:** el sistema está acoplado. Bajar el clay de Djokovic de 1.05 a 1.02 mejoró Djokovic-Federer clay pero empeoró Djokovic-Nadal clay (de 42% a 63%, alejándose del real 31%). Cualquier blend entre 0% y 60% empeoraba el error total H2H.

### Bonus por GS en superficie ("aura de especialidad")

**Idea:** los especialistas de superficie (Nadal en clay, Federer en hierba) tienen un "aura" que el motor no captura.

**Por qué se descartó:** la correlación entre GS en superficie y residual adicional más allá del modifier es **−0.36** (negativa y débil). El surface modifier ya captura casi completamente la prima de especialidad. Para los pocos casos con residual positivo (Wilander clay, Murray hierba), los H2H reales tienen n demasiado pequeño (n=2-6) para justificar ajustes.

---

## 6. Límites estructurales conocidos

### Nadal-Djokovic hard (motor ~19%, real 48%)

El gap residual de 29pp es irreducible con la arquitectura actual. Origen:

- Diferencia de `baseServe`: Djokovic 0.692 vs Nadal 0.672 → 0.020pp de ventaja real
- Diferencia de `surface.hard`: Djokovic 1.08 vs Nadal 0.98 → gap calibrado de 0.024pp con kH=0.35
- Total: 0.044pp de ventaja de Djokovic al saque en hard

Los datos ATP de `win1st`/`win2nd` son correctos. Corregirlos falsificaría las estadísticas reales de Nadal. Fix F comprimió el gap de 33pp a 28pp — se llegó al límite de lo que la calibración puede hacer.

### Ranking all-vs-all no comparable entre eras

El ranking matricial (todos vs todos, 300 partidos por par) no es una métrica válida para comparar jugadores de eras distintas. Lendl, Courier y Ferrer caen en ese ranking porque se les enfrenta 300 veces a Djokovic y Alcaraz — partidos que nunca ocurrieron. El motor es válido para simular matchups entre cualquier par de jugadores; el ranking inter-era es una fantasía especulativa, no una métrica de calibración.

### Djokovic clay inflado +17pp en ranking (n=550, bug real)

Djokovic obtiene ~87% en clay en rankings all-vs-all cuando su win% real en clay es ~70%. El problema no son los modifiers sino la composición del campo: en la simulación juega en clay contra Roddick (clay=0.88), Isner (clay=0.84) y Raonic (clay=0.88), jugadores que en la realidad no llegan a cruzarse con él en tierra porque pierden antes. Los H2H directos Djokovic-Nadal y Djokovic-Federer en clay están razonablemente calibrados.

---

## 7. Metodología de calibración

### Base de datos de referencia

9.561 partidos reales entre los 104 jugadores del simulador, 1985–2025. Actualizado con 72 partidos de la temporada 2025. Formato: `[ganador, perdedor, superficie, nivel, torneo, ronda, score, año]`.

### H2H de referencia para calibración

Los fixes se validan contra un conjunto fijo de matchups con suficiente muestra real (n≥20):

| Matchup | Real | Estado motor |
|---------|------|-------------|
| Nadal vs Djokovic clay | 31% (n=29) | ~42% (−11pp) |
| Nadal vs Djokovic hard | 48% (n=~30) | ~19% (−29pp) — límite estructural |
| Federer vs Nadal clay | 26% (n=~40) | ~19% (−7pp) |
| Djokovic vs Federer hard | 60% (n=~80) | ~66% (+6pp) |
| Alcaraz vs Sinner hard | 61% (n=~30) | ~57% (−4pp) |
| Sampras vs Agassi hard | 58% (n=~60) | ~60% (+2pp) ✅ |

### Instrumento de calibración correcto

El error total en H2H reales (≥20 partidos) es el único instrumento fiable. El ranking matricial all-vs-all no sirve para calibrar porque:
1. Mezcla eras con distribuciones de campo incomparables
2. Los jugadores se enfrentan a rivales que no son sus oponentes naturales
3. Los jugadores con pocos datos en la BD aparecen mal posicionados no por el motor sino por sesgo de muestra

---

## 8. Herramientas de análisis generadas

Durante el proceso de calibración se generaron tres herramientas HTML independientes:

### era_rankings.html — Rankings intra-era

Simulación de cada jugador contra los de su propia era (solapamiento ≥3 años). Compara win% simulado vs win% real de la BD. Filtrable por era (5 eras), superficie y modo de ordenación.

**Uso:** identificar qué jugadores tienen brechas sistemáticas entre simulación y realidad dentro de su contexto histórico natural.

### resilience.html — Análisis de resiliencia

Para cada jugador del Big 3 era (2003–2025), calcula:
- **Comeback%:** P(ganar partido | perdiste el 1er set) en Bo5
- **Fragilidad%:** P(perder partido | ganaste el 1er set) en Bo5
- **Índice muro:** Comeback% − Fragilidad%

Incluye scatter plot comeback vs fragilidad y tabla ordenable.

**Hallazgo clave:** Djokovic tiene índice +40pp (comeback 47%, fragilidad 6%). Monfils tiene −17pp (comeback 9%, fragilidad 26%). Esta diferencia de 57pp en el índice justificó el Fix G.

---

## 9. Ideas para secciones de la web

Las herramientas y análisis desarrollados pueden integrarse directamente en TennisSimu como nuevas secciones. Propuestas:

### A. Sección "GOAT Ranking" — Rankings por era

Mostrar los rankings intra-era con la comparativa sim vs BD. Permite al usuario seleccionar era, superficie y modo de ordenación. Transparencia total: el usuario ve cuán alejado está el motor de la realidad y por qué.

**Texto de contexto sugerido:**
> *"Este ranking enfrenta a cada jugador contra sus contemporáneos reales. Los win% de simulación reflejan el motor Markov; los de la base de datos son los resultados reales del circuito. La brecha entre ambos tiene causas documentadas: el motor simula al jugador en su mejor versión durante toda su carrera, mientras que la base de datos incluye partidos de su etapa de declive y contra rivales de su era específica."*

### B. Sección "Resiliencia" — El muro mental

Visualización del comeback% y fragilidad de cada jugador derivados de datos reales.

**Texto de contexto sugerido:**
> *"¿Cómo de difícil es remontar contra cada jugador? Calculado a partir de {n} partidos reales a 5 sets. Comeback% = probabilidad de ganar el partido habiendo perdido el primer set. Fragilidad% = probabilidad de perder el partido habiendo ganado el primer set. El índice muro combina ambas métricas."*

### C. Sección "Motor" — Transparencia técnica

Explicar los fixes del motor en lenguaje accesible para el usuario general.

**Estructura sugerida:**
1. Qué es el motor Markov (una línea)
2. Los 6 fixes activos con explicación en lenguaje normal
3. Los límites conocidos (Nadal en hard, ranking inter-era)
4. Cómo calibramos: la metodología de H2H de referencia

### D. Estadísticas avanzadas en ficha de jugador

Añadir en cada ficha de jugador:
- Comeback% con contexto ("Nadal remonta el 45% de los partidos en los que pierde el primer set — top 5 histórico")
- Índice muro con posición en el campo
- H2H más representativos contra contemporáneos (de la BD real)

---

*Documentación generada en sesiones de calibración intensiva, marzo 2026.*  
*Base técnica: análisis de 9.561 partidos reales, 84 grid searches de calibración, 12 H2H de referencia con N=3000-4000 simulaciones cada uno.*
