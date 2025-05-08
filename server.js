const fs = require("fs");
const path = require("path");
const express = require("express");
const RED = require("node-red");
const http = require("http");
const https = require("https");
const mysql = require("mysql2"); // Paquete para la conexión a MariaDB

// Creamos la aplicación Express
const app = express();

// Ruta de flows.json
let flowsPath;
if (process.resourcesPath) {
  flowsPath = path.join(process.resourcesPath, 'flows.json');
} else {
  flowsPath = path.join(__dirname, 'flows.json');
}

if (!fs.existsSync(flowsPath)) {
  console.log('El archivo flows.json no se ha encontrado:', flowsPath);
  process.exit(1);
} else {
  console.log('Archivo flows.json encontrado:', flowsPath);
}

// Carpeta de usuario de Node-RED
const userDir = path.join(process.env.APPDATA, 'CapturadorIntraza');
if (!fs.existsSync(userDir)) {
  fs.mkdirSync(userDir, { recursive: true });
}

// Bloquear GET a "/"
app.use((req, res, next) => {
  if (req.method === 'GET' && req.url === '/') {
    res.status(403).send("Acceso no autorizado");
  } else {
    next();
  }
});

// Configuración de Node-RED
const settings = {
  httpAdminRoot: false,
  httpNodeRoot: "/api",
  userDir: userDir,
  flowFile: flowsPath,
  uiPort: 1880,
};

// Inicializar Node-RED
RED.init(null, settings);
app.use(settings.httpNodeRoot, RED.httpNode);

// Crear servidor HTTP en puerto 1880
const httpServer = http.createServer(app);
httpServer.listen(1880, () => {
  console.log("🌐 HTTP escuchando en http://localhost:1880");
});

// Crear servidor HTTPS en puerto 8443
const key = fs.readFileSync(path.join(__dirname, 'key.pem'), 'utf8');
const cert = fs.readFileSync(path.join(__dirname, 'cert.pem'), 'utf8');

const httpsServer = https.createServer({ key, cert }, app);
httpsServer.listen(8443, () => {
  console.log("🔐 HTTPS escuchando en https://localhost:8443");
});

// Iniciar flujos de Node-RED
RED.start();

// Conexión a MariaDB (Conexión a int_b1 e int_b2)
const dbConnection_b1 = mysql.createConnection({
  host: 'localhost',  
  user: 'root',       
  password: '', 
  database: 'int_b1', // Conexión a la base de datos int_b1
  port: 3306,  // Puerto de MariaDB
});

const dbConnection_b2 = mysql.createConnection({
  host: 'localhost',  // Cambiar a la IP de la máquina si es remoto
  user: 'root',       // Cambiar si es otro usuario
  password: '', 
  database: 'int_b2', // Conexión a la base de datos int_b2
  port: 3306,  // Puerto de MariaDB
});

// Probar la conexión a MariaDB para int_b1
dbConnection_b1.connect((err) => {
  if (err) {
    console.error('Error al conectar a la base de datos int_b1:', err.stack);
    return;
  }
  console.log('Conexión exitosa a la base de datos int_b1');
});

// Probar la conexión a MariaDB para int_b2
dbConnection_b2.connect((err) => {
  if (err) {
    console.error('Error al conectar a la base de datos int_b2:', err.stack);
    return;
  }
  console.log('Conexión exitosa a la base de datos int_b2');
});
