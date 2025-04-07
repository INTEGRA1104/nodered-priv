const RED = require("node-red");
const fs = require("fs");
const os = require("os");
const path = require("path");

// Ruta temporal donde pondremos el flujo extraído
const tempDir = path.join(os.tmpdir(), "nodered-priv");
const flowPath = path.join(tempDir, "flows.json");

// Asegurarse de que exista el directorio temporal
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Copiar flows.json desde el ejecutable al sistema de archivos real
const embeddedFlow = fs.readFileSync(path.join(__dirname, "flows.json"), "utf8");
fs.writeFileSync(flowPath, embeddedFlow);

// Log de verificación
console.log("Flujo copiado a:", flowPath);

// Configuración del servidor HTTP (oculto)
const server = http.createServer((req, res) => {
  res.writeHead(403, { "Content-Type": "text/plain" });
  res.end("Acceso no autorizado");
});

// Configuración de Node-RED
const settings = {
  httpAdminRoot: false, // Oculta el editor web de Node-RED
  httpNodeRoot: "/api", // Solo expone los endpoints en "/api"
  userDir: tempDir, // Usa la carpeta temporal para flujos y credenciales
  flowFile: flowPath, // Archivo con el flujo exportado
  uiPort: 1880,
};

// Iniciar Node-RED
RED.init(server, settings);
server.listen(1880, () => console.log("Node-RED corriendo en modo oculto"));
RED.start();
