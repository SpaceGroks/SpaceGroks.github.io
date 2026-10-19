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
- [ ] Instalable en el móvil como app (manifest y service worker)
- [ ] Modo director de vuelo: pasos reales de la cuenta atrás de un Falcon 9 (carga de combustible, separación de etapas, aterrizaje) pulsando en el momento justo
- [ ] Logros (primer acierto, 5 predicciones seguidas, apostar contra la racha y acertar...)
- [ ] Ficha de misión al pulsar un lanzamiento: descripción, propulsor, zona de aterrizaje, enlace al directo
- [ ] Enlace a "Fórmate" en el globo: la página de la misión y, de vez en cuando, las ofertas de trabajo de SpaceX
- [ ] Reto rápido de 30 segundos con 3 preguntas
- [ ] Probabilidad meteorológica en las predicciones cuando esté disponible
- [ ] Mapa con zonas de aterrizaje además de plataformas
