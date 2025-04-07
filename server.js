const fs = require('fs');
const path = require('path');
const RED = require('node-red');

// Usamos 'process.resourcesPath' si estás usando nexe o __dirname si no
let flowsPath;
if (process.resourcesPath) {
  // Si estamos en un entorno empaquetado con nexe
  flowsPath = path.join(process.resourcesPath, 'flows.json');
} else {
  // Si estamos en un entorno no empaquetado, usamos __dirname
  flowsPath = path.join(__dirname, 'flows.json'); // Aquí se usa el directorio de ejecución
}

// Comprobamos si flows.json está disponible
if (!fs.existsSync(flowsPath)) {
  console.log('El archivo flows.json no se ha encontrado en la ubicación esperada:', flowsPath);
  process.exit(1); // Detenemos si no se encuentra el flujo
} else {
  console.log('Archivo flows.json encontrado:', flowsPath);
}

// Crear un directorio en un lugar accesible, como la carpeta del usuario
const userDir = path.join(process.env.APPDATA, 'CapturadorIntrazaAlucoat');  // Usamos la carpeta APPDATA para almacenamiento seguro

// Aseguramos que el directorio exista
if (!fs.existsSync(userDir)) {
  fs.mkdirSync(userDir, { recursive: true });
}

// Creamos el servidor HTTP
const server = require("http").createServer((req, res) => {
  res.writeHead(403, { "Content-Type": "text/plain" });
  res.end("Acceso no autorizado");
});

// Configuración de Node-RED
const settings = {
  httpAdminRoot: false, // Desactiva el acceso al editor web de Node-RED
  httpNodeRoot: "/api", // Expone solo los endpoints en "/api"
  userDir: userDir, // Usamos la carpeta APPDATA para almacenar configuraciones y flujos
  flowFile: flowsPath, // Ruta del archivo de flujo
  uiPort: 1880, // Puerto donde corre Node-RED
};

// Iniciamos Node-RED
RED.init(server, settings);

// Iniciamos el servidor
server.listen(1880, () => console.log("Node-RED corriendo en modo oculto"));

// Cargamos y arrancamos los flujos de Node-RED
RED.start();
