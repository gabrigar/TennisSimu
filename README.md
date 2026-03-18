# Tennis<span>Simu</span>

> Simulador de tenis histórico con motor Markov · 104 jugadores · 9.489 partidos reales

**🔗 Live demo:** [gabrigar.github.io/TennisSimu](https://gabrigar.github.io/TennisSimu/)

---

## ¿Qué es TennisSimu?

TennisSimu permite simular partidos de tenis entre cualquier combinación de los 104 mejores jugadores de la historia del tenis (1970–2025), usando un motor de simulación basado en cadenas de Markov calibrado con estadísticas reales de cada jugador en su mejor momento.

¿Quién ganaría un partido entre Federer en hierba y Nadal en tierra? ¿Y McEnroe contra Djokovic en pista dura? TennisSimu te da una respuesta probabilística fundamentada en datos.

---

## Características

- **Simulación point-by-point** con motor Markov calibrado por superficie
- **104 jugadores** desde Borg hasta Sinner/Alcaraz
- **9.489 partidos históricos reales** (1985–2024) con filtros avanzados
- **3 superficies** — pista dura, tierra batida, hierba
- **Formato configurable** — 3 o 5 sets, con o sin tiebreak final
- **100 partidos de golpe** para ver estadísticas de victoria a largo plazo
- **Comparador head-to-head** con palmarés, velocidades y stats
- **Perfil de jugador** detallado con velocidades de golpeo, distribución de rallies y percentiles
- **Soporte EN / ES** — i18n completo con cambio de idioma instantáneo
- **Diseño responsive** — experiencia optimizada para móvil y desktop
- **Diseño brutalist** con paleta oscura y tipografía Anton

---

## Stack técnico

```
Vanilla JS  ·  CSS Custom Properties  ·  GitHub Pages
```

Sin frameworks. Sin dependencias. Solo HTML, CSS y JavaScript.

---

## Actualizacion 2026-03-18 - Version N

La Version N deja activa la iteracion mas reciente del motor y del hub de rankings.

### Resumen de lo realizado hoy

- Se alinearon `js/engine.js` y `js/app.js` para compartir la misma base critica del motor.
- Se simplifico la formula del saque para evitar doble contabilidad.
- Se dejaron a `0` los bonus puros de saque:
  - `serveSpeedBonus`
  - `serverPower`
  - `serverShortRallyBonus`
  - `netBonus`
- Se mantuvo `baseServe` como nucleo del saque real:

```js
baseServe = serve1pct * win1st + (1 - serve1pct) * win2nd
```

- La formula conceptual base del punto al saque queda:

```js
pServe = (baseServe * sMod) - returnPressure
```

- Se añadio una señal pequena de `shotEfficiency` a partir del ratio `winners/errors`.
- Esa señal solo actua en rallies medios y largos, con impacto pequeno.
- Se regenero una variante GOAT con esa señal y finalmente se dejo como activa en `js/rankings_hub_data.js`.
- Se conservaron snapshots alternativos para comparar o revertir:
  - `js/rankings_hub_data_pre_baseserve.js`
  - `js/rankings_hub_data_shot_efficiency.js`
  - `rankings-pre-baseserve.html`
- Se simplifico el hub de rankings a dos modos:
  - `Calculated GOAT`
  - `Real GOAT`
- Se elimino `Era Sim` del hub por redundante.
- Se mantuvieron los filtros por superficie, era y jugador.
- Se renombro la navegacion principal de la web a:
  - `Matchup Simulator`
  - `Grand Slam Simulator`
  - `Stats`
  - `Compare`
  - `History`
  - `Rankings Simulator`
- Se rehizo el bloque superior del simulador para compactarlo en un bloque central por capas:
  - `Select Players`
  - `Match Config`
  - `Simulate Button`
- Se retocaron elementos visuales del `Grand Slam Simulator`, incluido el bracket y la `imagen 2` del cuadro.

### Nueva señal shotEfficiency

Se calcula de forma conservadora:

```js
ratio = winners / errors
shotEfficiencyEdge = clamp((ratio - 1.5) * 0.02, -0.02, 0.02)
```

Y se aplica solo en:

```js
mid rally  -> + shotEdge * 0.4
long rally -> + shotEdge * 0.3
```

La intencion es favorecer ligeramente a los jugadores que producen mejor relacion `winners/errors` sin volver a inflar el saque.

## Documentacion del proyecto

- `README.md`: vision general y uso del simulador
- `docs/ENGINE.md`: motor, calibracion y notas tecnicas
- `docs/REPOSITORY.md`: estructura recomendada para GitHub y checklist de publicacion

| Archivo | Descripción |
|---|---|
| `index.html` | Estructura principal de la web y navegacion |
| `js/app.js` | Capa UI completa (~1850 líneas) |
| `js/engine.js` | Motor Markov activo |
| `js/players.js` | 104 jugadores con stats |
| `js/results_db.js` | 9.489 partidos reales (764KB) |
| `css/style.css` | Diseño completo + responsive + i18n |

---

## Motor de simulación

El motor simula cada punto individualmente usando cadenas de Markov con los siguientes factores:

### Estado actual del motor en Version N

- `baseServe` es ahora el corazon del saque real
- los bonus puros de saque estan anulados
- la presion del restador sigue activa
- `shotEfficiency` se usa solo en rallies medios y largos

Formula conceptual:

```js
baseServe = serve1pct * win1st + (1 - serve1pct) * win2nd
pServe = (baseServe * sMod) - returnPressure
```

- **Velocidad y precisión de saque** (`serve1pct`, `win1st`, `win2nd`)
- **Poder de groundstrokes** (derecha y revés en km/h)
- **Modificadores de superficie** calibrados por superficie (`hard=0.35`, `clay=0.55`, `grass=0.55`)
- **Distribución de rallies** (puntos cortos 0-4 golpes, medios 5-8, largos 9+)
- **Juego de red** (`net_win`)
- **Rendimiento en tiebreaks** (`tb_win`) y sets decisivos / comeback (`comeback`)
- **Presión en puntos grandes del juego** (`pressure_index_100` si existe, o estimado desde stats legacy)

### Fix M2: presión en puntos grandes

La versión actual del motor añade un ajuste calibrado para puntos de alta tensión dentro del juego:

- `30-30`
- `deuce / ventaja`
- `break point`
- puntos de hold importantes

La idea es capturar mejor a los jugadores que sostienen presión estructural durante el set, especialmente restadores y competidores de élite como Djokovic, Nadal o Murray. En el motor se usa `pressure_index_100` cuando el jugador viene enriquecido desde `players_v3.js`; si no existe, se estima con esta aproximación:

```text
pressure ≈ returnWin*60 + breakConvert*40 + rally_long/2.5
```

El ajuste es deliberadamente pequeño y solo se activa en puntos críticos para evitar doble contabilidad con la devolución y el juego en rallies largos. En las pruebas internas fue el mejor fix reciente: mejoró el error agregado del basket de referencia frente a pegadores inflados sin reescribir toda la arquitectura del rally.

> `engine.js` está calibrado; cualquier cambio nuevo conviene validarlo contra BD real antes de dejarlo fijo.

### Datos enriquecidos

Además del `players.js` clásico, el proyecto ya incluye:

- [js/players_v2.js](./js/players_v2.js): versión generada desde tablas CSV ampliadas
- [js/players_v3.js](./js/players_v3.js): fusión conservadora que mantiene todos los stats legacy y añade campos nuevos como `model.*`, `context.*`, `style_bucket` y `hand`
- [js/results_extra.js](./js/results_extra.js): dataset derivado de los CSV point-by-point de Jeff Sackmann con métricas por partido como puntos al saque/return, aces, dobles faltas, holds, breaks y break points
- [js/results_extra_players.js](./js/results_extra_players.js): agregados por jugador construidos desde `results_extra.js`, con métricas globales y splits por tour, draw y año
- [js/results_extra_players_ranked.js](./js/results_extra_players_ranked.js): rankings listos para los 104 jugadores del simulador, filtrados por mínimo de partidos y ordenados por métricas como `controlIndex100`, saque, resto y rachas
- [js/player_game_resilience.js](./js/player_game_resilience.js): señal específica para motor con `game_resilience_100`, derivada de patrones de rachas de juegos y mezclada con proxy de comeback/presión para jugadores con poca muestra PBP
- [js/player_game_control.js](./js/player_game_control.js): señal específica para motor con `game_control_100`, derivada de patrones de rachas positivas de juegos y mezclada con proxy de saque/tiebreak/presión para jugadores con poca muestra PBP
- [js/player_set_control_surface.js](./js/player_set_control_surface.js): señal específica por superficie para cierres de set, basada en `closeSetWithBreakLeadPct`, `holdTwoGameLeadPct` y un blend con proxy para cubrir los 104 jugadores
- [js/player_structural_serve_return.js](./js/player_structural_serve_return.js): segundo pase estructural de `serve/return`, con filtrado de matchups de dinámica neutra y ratings `pureHoldPct` / `pureBreakPct` por superficie

Esto permite enriquecer análisis y futuros fixes del motor sin alterar automáticamente los stats base de simulación.

Para regenerar `results_extra.js`:

```bash
node tools/build_results_extra.js
```

Por defecto el script lee los `pbp_matches_*.csv` de `C:/Users/gabri/Documents/Webtenis/02 JeffSackmanntennis/tennis_pointbypoint-master` y construye un archivo compacto con `fields` + `matches` para poder explotarlo luego desde JS sin reprocesar el `pbp` crudo cada vez.

Para regenerar los agregados por jugador:

```bash
node tools/build_results_extra_players.js
```

Este segundo paso genera `results_extra_players.js` con resumen por jugador (`overall`) y cortes por `tour`, `draw` y `year`, incluyendo win%, puntos ganados al saque/resto, hold%, conversión/salvado de break points, aces, dobles faltas y comportamiento en tiebreaks.

Además, ahora se derivan métricas de rachas de juegos consecutivos ganados/perdidos a partir de la secuencia real de juegos del `pbp`, incluyendo:

- probabilidad de convertir una racha de 2 juegos ganados en 3 (`continueAfterTwoWinsPct`)
- probabilidad de cortar una racha de 2 juegos perdidos ganando el siguiente (`recoverAfterTwoLossesPct`)
- frecuencia de partidos con rachas de 3 juegos a favor o en contra
- `controlIndex100`, un índice sintético de control del partido basado en continuidad positiva, capacidad de frenar tramos malos y presencia/ausencia de rachas largas
- `game_resilience_100`, señal reactiva para cortar rachas negativas en el motor
- `game_control_100`, señal proactiva para consolidar rachas positivas; actualmente calculada pero desactivada en el motor (`GAME_CONTROL_COEF = 0.000`)
- `setControlSurface100`, señal específica de cierre de set por superficie para contextos con break arriba o ventaja de 2 juegos

Para regenerar la señal que usa el motor:

```bash
node tools/build_player_game_resilience.js
```

Y para regenerar la señal complementaria de control positivo del partido:

```bash
node tools/build_player_game_control.js
```

Y para regenerar la señal de cierre de set por superficie:

```bash
node tools/build_player_set_control_surface.js
```

Y para regenerar el segundo pase estructural de saque/resto:

```bash
node tools/build_player_structural_serve_return.js
```

Este segundo pase separa, dentro del `pbp` con superficie conocida, dos capas:

- componente estructural: hold/break por superficie
- componente dinámico: double-break runs, comebacks de set y colapsos tras break arriba

Metodología actual:

- baseline estructural por matchup: `expected_break_pct = mean(player_break_pct_ex_matchup, opponent_break_allowed_pct_ex_matchup)`
- filtro `strict`: `|residual_break| <= 0.04` en ambos sentidos y además sin señales dinámicas extremas
- filtro `relaxed`: igual, pero con residual `<= 0.06` para poder explorar algo de señal con la cobertura segura actual

Resultado actual con superficies seguras:

- `strict`: `0` matchups aceptados
- `relaxed`: `2` matchups aceptados
- conclusión práctica: con el filtro duro, la cobertura todavía es demasiado pequeña para recalibrar `serve/return` solo desde esos matchups

Por eso, el archivo actual deja los ratings por jugador construidos sobre el subconjunto `relaxed`, y siempre blended con proxy para no castigar a los jugadores sin muestra suficiente.

Para calibrar el impacto de ambas señales en el engine hay dos baskets oficiales:

- `tools/calibration_basket_game_resilience.json` + `tools/calibrate_game_resilience_coef.js`
- `tools/calibration_basket_game_control.json` + `tools/calibrate_game_control_coef.js`

Calibración de `GAME_CONTROL_COEF`:

- corrida simple inicial: mejor valor observado `0.012`
- corrida más robusta con `3` seeds (`11, 29, 47`) y `180` simulaciones por partido real: la rejilla quedó casi plana y `0.000` salió ligeramente mejor en media
- barrido global sobre todos los H2H reales con muestra mínima `>= 15` partidos: `32` matchups elegibles; mejor valor observado `0.006` con error ponderado `12.3%`, apenas por delante de `0.000`
- decisión actual del motor: `GAME_CONTROL_COEF = 0.000`, porque en las pruebas posteriores la mejora no se sostuvo con suficiente robustez
- `GAME_RESILIENCE_COEF` se mantiene fijo en `0.010` mientras se calibra control

Esta capa se carga antes de `engine.js` y permite modular la probabilidad de cortar una mala racha cuando un jugador encadena 2 o más juegos perdidos.
En la calibración inicial sobre un basket de 10 H2H reales por superficie, el mejor valor fue `GAME_RESILIENCE_COEF = 0.010`.
El basket oficial quedó guardado en [tools/calibration_basket_game_resilience.json](./tools/calibration_basket_game_resilience.json) y lo consume [tools/calibrate_game_resilience_coef.js](./tools/calibrate_game_resilience_coef.js).

Piloto actual de cierre de set en hard:

- usa [js/player_set_control_surface.js](./js/player_set_control_surface.js) con superficies conocidas (`hard`, `clay`, `grass`; el resto queda en `unknown`)
- solo se activa en `hard`
- solo se activa en contexto de cierre de set
- pondera el efecto por confianza empírica de la muestra PBP del jugador en esa superficie
- calibración formal en top 10 GOAT, `hard`, H2H con muestra mínima `>= 5`, `3` seeds (`11, 29, 47`) y `140` simulaciones por cruce:
  - mejor coeficiente observado: `SET_CLOSE_HARD_COEF = 0.004`
  - baseline `0.000`: error ponderado `10.15%`
  - piloto `0.004`: error ponderado `9.28%`

Script de calibración:

```bash
node tools/calibrate_set_close_hard_coef.js
```

Para regenerar los rankings listos:

```bash
node tools/build_results_extra_players_ranked.js
```

---

## Jugadores incluidos

104 jugadores de todas las eras, incluyendo:

**Big Three y contemporáneos:** Djokovic (24 GS), Nadal (22), Federer (20), Murray, Wawrinka

**Nuevas generaciones:** Alcaraz (7 GS), Sinner (4), Zverev (1), Medvedev, Rublev, Tsitsipas

**Leyendas:** Sampras (14 GS), Agassi (8), Becker (6), Edberg (6), Lendl (8), McEnroe (7), Connors (8), Borg (11), Vilas, Wilander

**Y muchos más** de los 70s hasta hoy.

---

## Páginas

| Pestaña | Función |
|---|---|
| `Matchup Simulator` | Selecciona dos jugadores, configura superficie/sets y simula |
| `Grand Slam Simulator` | Cuadro eliminatorio por Grand Slam con draw manual o aleatorio |
| `Stats` | Perfil completo de cada jugador con velocidades, stats y percentiles |
| `Compare` | Comparador head-to-head con palmares y barras de stats |
| `History` | 9.489 partidos reales con filtros por jugador, superficie, nivel y año |
| `Rankings Simulator` | Hub de rankings con `Calculated GOAT` y `Real GOAT` |

---

## Desarrollo local

```bash
git clone https://github.com/gabrigar/TennisSimu.git
cd TennisSimu
# Abrir index.html directamente en el navegador, o servir con:
npx serve .
```

No hay build step ni dependencias que instalar.

---

## Pendiente / Roadmap

- [ ] Imágenes de jugadores (`img/{id}.png`, 800×1067px, fondo `#0a0a0f`)
- [ ] Calibración de stats para ~50 jugadores
- [ ] Favicon
- [ ] Eliminar duplicado de Tiafoe en `players.js`

---

## Licencia

Proyecto personal · Datos estadísticos basados en fuentes públicas y estimaciones calibradas.
