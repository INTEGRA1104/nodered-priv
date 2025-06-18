const fs = require("fs");
const path = require("path");
const os = require("os");
const express = require("express");
const RED = require("node-red");
const http = require("http");
const https = require("https");
const mysql = require("mysql2");
const WebSocket = require("ws");

const originalLog = console.log;
console.log = function (...args) {
  if (
    args.length > 0 &&
    typeof args[0] === "string" &&
    args[0].includes("User directory")
  ) {
    // ocultamos este mensaje específico
    return;
  }
  originalLog.apply(console, args);
};

const app = express();


const appDir = path.dirname(process.execPath);


let flowsPath, flowsCredPath;
if (process.resourcesPath) {
  flowsPath = path.join(process.resourcesPath, "flows.json");
  flowsCredPath = path.join(process.resourcesPath, "flows_cred.json");
} else {
  flowsPath = path.join(appDir, "flows.json");
  flowsCredPath = path.join(appDir, "flows_cred.json");
}

if (!fs.existsSync(flowsPath)) {
  console.error("❌ No se encontró flows.json en:", flowsPath);
  process.exit(1);
}
if (!fs.existsSync(flowsCredPath)) {
  console.error("❌ No se encontró flows_cred.json en:", flowsCredPath);
  process.exit(1);
}


const userDir = path.join(
  process.env.APPDATA || process.env.HOME || os.tmpdir(),
  ".capturadorIntraza"
);
if (!fs.existsSync(userDir)) {
  fs.mkdirSync(userDir, { recursive: true });
}


function copyIfNeeded(src, dest) {
  if (
    !fs.existsSync(dest) ||
    fs.readFileSync(src, "utf8") !== fs.readFileSync(dest, "utf8")
  ) {
    fs.copyFileSync(src, dest);
    console.log(`FLOWS CORRECTOS`);
  } 
}


const destFlowsPath = path.join(userDir, "flows.json");
const destFlowsCredPath = path.join(userDir, "flows_cred.json");

copyIfNeeded(flowsPath, destFlowsPath);
copyIfNeeded(flowsCredPath, destFlowsCredPath);


const settings = {
  httpAdminRoot: false,
  httpNodeRoot: "/api",
  userDir: userDir,
  flowFile: destFlowsPath,
  credentialSecret: "CapturadoRIntraZa1104", 
  uiPort: 1880,
  websocket: {
    enable: true,
    port: 1881,
  },
  logging: {
    console: {
      level: "warn",  
      metrics: false,
      audit: false
    }
  }
};


app.use((req, res, next) => {
  if (req.method === "GET" && req.url === "/") {
    res.status(403).send("Acceso no autorizado");
  } else {
    next();
  }
});


RED.init(null, settings);
app.use(settings.httpNodeRoot, RED.httpNode);


const httpServer = http.createServer(app);
httpServer.listen(1880, () => {
  console.log("🌐 HTTP escuchando en http://localhost:1880");
});

const key = fs.readFileSync(path.join(__dirname, "key.pem"), "utf8");
const cert = fs.readFileSync(path.join(__dirname, "cert.pem"), "utf8");
const httpsServer = https.createServer({ key, cert }, app);
httpsServer.listen(8443, () => {
  console.log("🔐 HTTPS escuchando en https://localhost:8443");
});


RED.start();


const dbConnection_b1 = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "int_b1",
  port: 3306,
});
const dbConnection_b2 = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "int_b2",
  port: 3306,
});

dbConnection_b1.connect((err) => {
  if (err) return console.error("❌ Error int_b1:", err.stack);
  console.log("✅ Conexión exitosa a int_b1");
});
dbConnection_b2.connect((err) => {
  if (err) return console.error("❌ Error int_b2:", err.stack);
  console.log("✅ Conexión exitosa a int_b2");
});


const wss = new WebSocket.Server({ noServer: true });

wss.on("connection", (ws) => {
  console.log("📡 Cliente WebSocket conectado");
  ws.send(JSON.stringify({ message: "¡Conexión WebSocket exitosa!" }));
  ws.on("message", (message) => {
    console.log("📩 Mensaje del cliente:", message);
  });
});


httpServer.on("upgrade", (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit("connection", ws, req);
  });
});
httpsServer.on("upgrade", (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit("connection", ws, req);
  });
});

function cleanup() {
  try {
    if (fs.existsSync(destFlowsPath)) fs.unlinkSync(destFlowsPath);
    if (fs.existsSync(destFlowsCredPath)) fs.unlinkSync(destFlowsCredPath);
    if (fs.existsSync(userDir)) fs.rmdirSync(userDir);
    console.log("🧹 Proceso Terminad");
  } catch (e) {
    console.warn("⚠️ Error limpieza", e);
  }
}

process.on("exit", cleanup);
process.on("SIGINT", () => {
  cleanup();
  process.exit();
});
process.on("SIGTERM", () => {
  cleanup();
  process.exit();
});
process.on("uncaughtException", (err) => {
  console.error("❌ Excepción no capturada:", err);
  cleanup();
  process.exit(1);
});
