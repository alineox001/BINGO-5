# Bingo en vivo – Latrell City (v3)
Sin dependencias. Requiere Node 18 o superior.

## Uso local
    node server.js
- Participantes: http://localhost:3000/
- Anfitrión (privado): http://localhost:3000/host?key=TU_CLAVE   (HOST_KEY=miclave node server.js para fijarla)

## Render
Start command: `node server.js`. Variable de entorno `HOST_KEY` = tu clave.
Participantes: https://TU-APP.onrender.com/  ·  Anfitrión: https://TU-APP.onrender.com/host?key=TU_CLAVE
No compartas el enlace del anfitrión. /health responde "ok" para monitores.

## Demo sin servidor
Abre `bingo-demo.html` en el navegador (o publícalo como enlace). Incluye anfitrión y participantes simulados.
El enlace de participantes de la demo termina en `#participante` y se conecta al anfitrión de otra pestaña del mismo navegador.

## Reglas
- Cada participante recibe 16 números del 1 al 30 en orden aleatorio; se marcan solos. Sin repetidos.
- Se premian 1, 2 o 3 puestos. Si varios completan con el mismo número, empatan.
- La inscripción se cierra con el primer número (el anfitrión puede abrirla/cerrarla). "Nueva partida" da plantillas nuevas.
- El estado vive en memoria: si Render reinicia el servicio, se pierde la partida.
