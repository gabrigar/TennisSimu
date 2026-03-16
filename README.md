# SimuTennis
Tennis Simulator
Tennis<span>Simu</span>

Simulador de tenis histórico con motor Markov · 104 jugadores · 9.489 partidos reales

🔗 Live demo: gabrigar.github.io/TennisSimu

¿Qué es SimuTennis?
SimuTennis permite simular partidos de tenis entre cualquier combinación de los 104 mejores jugadores de la historia del tenis (1970–2025), usando un motor de simulación basado en cadenas de Markov calibrado con estadísticas reales de cada jugador en su mejor momento.
¿Quién ganaría un partido entre Federer en hierba y Nadal en tierra? ¿Y McEnroe contra Djokovic en pista dura? SimuTennis te da una respuesta probabilística fundamentada en datos.

Características

Simulación point-by-point con motor Markov calibrado por superficie
104 jugadores desde Borg hasta Sinner/Alcaraz
9.489 partidos históricos reales (1985–2024) con filtros avanzados
3 superficies — pista dura, tierra batida, hierba
Formato configurable — 3 o 5 sets, con o sin tiebreak final
100 partidos de golpe para ver estadísticas de victoria a largo plazo
Comparador head-to-head con palmarés, velocidades y stats
Perfil de jugador detallado con velocidades de golpeo, distribución de rallies y percentiles
Soporte EN / ES — i18n completo con cambio de idioma instantáneo
Diseño responsive — experiencia optimizada para móvil y desktop
Diseño brutalist con paleta oscura y tipografía Anton


Stack técnico
Vanilla JS  ·  CSS Custom Properties  ·  GitHub Pages
Sin frameworks. Sin dependencias. Solo HTML, CSS y JavaScript.
ArchivoDescripciónindex.htmlEstructura de 4 pestañasjs/app.jsCapa UI completa (~1850 líneas)js/engine.jsMotor Markov — no modificarjs/players.js104 jugadores con statsjs/results_db.js9.489 partidos reales (764KB)css/style.cssDiseño completo + responsive + i18n

Motor de simulación
El motor simula cada punto individualmente usando cadenas de Markov con los siguientes factores:

Velocidad y precisión de saque (serve1pct, win1st, win2nd)
Poder de groundstrokes (derecha y revés en km/h)
Modificadores de superficie calibrados con SURF_CALIBRATION = 0.55
Distribución de rallies (puntos cortos 0-4 golpes, medios 5-8, largos 9+)
Juego de red (net_win)
Rendimiento en tiebreaks (tb_win) y sets decisivos (dec_win)


⚠️ engine.js está calibrado y no debe modificarse.


Jugadores incluidos
104 jugadores de todas las eras, incluyendo:
Big Three y contemporáneos: Djokovic (24 GS), Nadal (22), Federer (20), Murray, Wawrinka
Nuevas generaciones: Alcaraz (7 GS), Sinner (4), Zverev (1), Medvedev, Rublev, Tsitsipas
Leyendas: Sampras (14 GS), Agassi (8), Becker (6), Edberg (6), Lendl (8), McEnroe (7), Connors (8), Borg (11), Vilas, Wilander
Y muchos más de los 70s hasta hoy.

Páginas
PestañaFunción⚡ SimulatorSelecciona dos jugadores, configura superficie/sets y simula📊 StatsPerfil completo de cada jugador con velocidades, stats y percentiles🔄 CompareComparador head-to-head con palmarés y barras de stats🔥 History9.489 partidos reales con filtros por jugador, superficie, nivel y año

Desarrollo local
bashgit clone https://github.com/gabrigar/TennisSimu.git
cd TennisSimu
# Abrir index.html directamente en el navegador, o servir con:
npx serve .
No hay build step ni dependencias que instalar.

Pendiente / Roadmap

 Imágenes de jugadores (img/{id}.png, 800×1067px, fondo #0a0a0f)
 Calibración de stats para ~50 jugadores
 Favicon
 Eliminar duplicado de Tiafoe en players.js


Licencia
Proyecto personal · Datos estadísticos basados en fuentes públicas y estimaciones calibradas.
