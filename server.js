import { loadConfig } from "./config.js";
import Logger from "./logger.js";

const config = loadConfig();
console.log("Configuration loaded successfully", config);

const logger = new Logger(config.log_file);
logger.startPeriodicStats(60);

logger.logRequest("miaw");
logger.logError("miuw");
