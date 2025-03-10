import { createWriteStream } from "fs";

export default class Logger {
  /**
   * Initializes a new Logger.
   * @param {string} logFile The path to the log file.
   */
  constructor(logFile) {
    this.logFile = logFile;
    this.totalRequests = 0;
    this.startTime = new Date();
    this.stream = createWriteStream(logFile, { flags: "a" });
  }

  /**
   * Write a log message with a timestamp.
   * @param {string} message  The message to log.
   */
  log(message) {
    const timestamp = new Date().toUTCString();
    const logEntry = `[${timestamp}] ${message}\n`;
    this.stream.write(logEntry);
  }

  /**
   * Logs an HTTP request and increments the request counter.
   * @param {string} clientIp  The client's IP address.
   * @param {string} requestLine  The HTTP request line.
   * @param {number} responseCode  The HTTP response code.
   */
  logRequest(clientIp, requestLine, responseCode) {
    this.totalRequests++;
    this.log(
      `REQUEST from ${clientIp}: '${requestLine}' response with ${responseCode}`
    );
  }

  /**
   * Logs an error message.
   * @param {string} errorMessage  The error message.
   */
  logError(errorMessage) {
    this.log(`ERROR: ${errorMessage}`);
  }

  /**
   * Logs server statistics such as total requests and uptime.
   */
  logStats() {
    const uptime = Math.floor((new Date() - this.startTime) / 1000);
    this.log(
      `STATS: Total Requests: ${this.totalRequests}, Uptime: ${uptime} seconds`
    );
  }

  /**
   * Starts periodic loggign of server statistics.
   * @param {'number'} intervalSeconds  Interval in seconds (default 60)
   */
  startPeriodicStats(intervalSeconds = 60) {
    setInterval(() => {
      this.logStats();
    }, intervalSeconds * 1000);
  }
}
