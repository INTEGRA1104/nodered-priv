const http = require("http");
const RED = require("node-red");

// Configuración del servidor HTTP (oculto)
const server = http.createServer((req, res) => {
  res.writeHead(403, { "Content-Type": "text/plain" });
  res.end("Acceso no autorizado");
});

// Configuración de Node-RED
const settings = {
  httpAdminRoot: false, // Oculta el editor web de Node-RED
  httpNodeRoot: "/api", // Solo expone los endpoints en "/api"
  userDir: __dirname, // Directorio donde están los flujos y credenciales
  flowFile: "flows.json", // Archivo con el flujo exportado
  uiPort: 1880, // Puerto donde corre Node-RED (opcional)
};

// Iniciar Node-RED
RED.init(server, settings);
server.listen(1880, () => console.log("Node-RED corriendo en modo oculto"));

// Cargar los flujos y arrancar Node-RED
RED.start();