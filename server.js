import { loadConfig } from "./config.js";
import Logger from "./logger.js";
import http from "http";
import { handleRequest } from "./requestHandler.js";
const config = loadConfig();
console.log("Configuration loaded successfully", config);

const logger = new Logger(config.log_file);
logger.startPeriodicStats(60);

const server = http.createServer((req, res) => {
  const clientIp = req.socket.remoteAddress;
  const requestLine = `${req.method} ${req.url} HTTP/${req.httpVersion}`;

  handleRequest(req, res, config, logger).catch((err) => {
    logger.logError(`Error handling request: ${err.message}`);
    res.writeHead(500, { "Content-Type": "text/html" });
    res.end("<html><body><h1>500 Internal Server Error</h1></body></html>");
  });
});

server.listen(config.port, config.host, () => {
  console.log(`HTTP Server is listening on ${config.host}:${config.port}`);
  logger.log(`Server started on ${config.host}:${config.port}`);
});
