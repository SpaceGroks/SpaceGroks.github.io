# Mejoras pendientes (por prioridad)

Cada 2 horas, de 9:00 a 21:00, se hace la primera sin marcar, se prueba y se marca. Cualquiera del grupo puede añadir ideas.

En cada ejecución, además: traducir al español (castellano, nombres propios intactos) las descripciones de los ids listados en `missing_es` de data.json y añadirlas a `i18n/desc_es.json` (texto completo de up.json/prev.json, cortado a 400 caracteres en límite de palabra con «…», como `cut()` de build_data.py).

- [x] Vista previa al compartir el enlace (imagen y texto Open Graph para X, WhatsApp y Reddit)
- [x] Mejoras de uso en móvil y accesibilidad (probar en pantalla de 390 px) (hecho el 19 oct, 11:05)
- [x] Crédito de cada foto (autor y licencia que da Launch Library 2) junto a la imagen, y no mostrar fotos sin licencia clara (hecho el 19 oct, 12:58)
- [x] Análisis de experto: cuadro de texto en cada lanzamiento para el razonamiento (física, ingeniería) más una predicción concreta y medible (aterrizaje, minutos de retraso, órbita) que se puntúa sola con los datos reales; se guarda en el navegador. Más adelante, evaluación del texto por una IA cuando haya almacenamiento compartido (hecho el 19 oct, 15:10; falta la evaluación por IA)
- [x] Racha de días: puntos extra por volver cada día y completar el desafío del globo (hecho el 19 oct, 17:09)
- [x] Aviso 15 minutos antes de cada lanzamiento (notificación del navegador si el jugador la acepta) con enlace al directo (hecho el 19 oct, 18:52)
- [x] Ficha de cada propulsor con su historial de vuelos, tiempo entre vuelos y apuesta "¿volverá a volar?" (hecho en el reto semanal del 19 oct)
- [x] "Aprende en 1 minuto" por misión: qué lleva, a qué órbita va y para qué sirve (hecho el 19 oct, 20:56)
- [x] Instalable en el móvil como app (manifest y service worker)
- [x] Modo director de vuelo: pasos reales de la cuenta atrás de un Falcon 9 (carga de combustible, separación de etapas, aterrizaje) pulsando en el momento justo (hecho el 20 oct, 11:02)
- [x] Logros (primer acierto, 5 predicciones seguidas, apostar contra la racha y acertar...) (hecho el 20 oct, 12:56)
- [x] Ficha de misión al pulsar un lanzamiento: descripción, propulsor, zona de aterrizaje, enlace al directo (hecho el 20 oct, 14:51)
- [x] Enlace a "Fórmate" en el globo: la página de la misión y, de vez en cuando, las ofertas de trabajo de SpaceX (hecho el 20 oct, 16:50)
- [x] Reto rápido de 30 segundos con 3 preguntas (hecho el 20 oct, 18:57)
- [x] Probabilidad meteorológica en las predicciones cuando esté disponible (hecho el 20 oct, 20:55)
- [x] Mapa con zonas de aterrizaje además de plataformas (hecho el 21 oct, 08:56)
- [x] Juego «¿Más o menos?»: ¿qué propulsor real ha volado más veces? Se encadenan aciertos hasta fallar (hecho el 21 oct, 10:53)
- [x] Mis estadísticas: tu porcentaje de aciertos por tipo de pregunta de predicción y por categoría, comparado con lo que pasó de verdad (hecho el 21 oct, 12:58)
- [x] Contador en directo de la racha real de aterrizajes y lanzamientos seguidos de SpaceX, con una apuesta semanal «¿seguirá la racha el domingo?» que se resuelve con los datos (hecho el 21 oct, 14:52)
- [x] Cronología del vuelo en la ficha de misión: todos los pasos publicados por Launch Library 2 (de la carga de propelente al aterrizaje y la separación de la carga) en T−/T+, traducidos, comparando cada paso con la mediana de ese cohete (hecho el 21 oct, 16:58)
- [ ] Ritmo de lanzamientos: días entre lanzamientos de SpaceX en los datos, récord de cadencia y apuesta «¿cuántos lanzamientos habrá esta semana?» que se resuelve sola
- [ ] Comparar dos propulsores lado a lado: vuelos, aterrizajes, días medios en tierra, zonas de aterrizaje usadas y último vuelo
