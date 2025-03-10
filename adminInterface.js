import http from "http";
import { readFile } from "fs/promises";

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "adminpass";

export const startAdminInterface = (config, logger) => {
  const server = http.createServer(async (req, res) => {
    // Check for Basic Authentication.
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Basic ")) {
      res.writeHead(401, {
        "WWW-Authenticate": 'Basic realm="Admin Interface"',
        "Content-Type": "text/plain",
      });
      res.end("Unauthorized");
      return;
    }
    const base64Credentials = authHeader.split(" ")[1];
    const credentials = Buffer.from(base64Credentials, "base64").toString(
      "utf8"
    );
    const [username, password] = credentials.split(":");
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      res.writeHead(401, {
        "WWW-Authenticate": 'Basic realm="Admin Interface"',
        "Content-Type": "text/plain",
      });
      res.end("Unauthorized");
      return;
    }

    // Gather statistics.
    const totalRequests = logger.totalRequests;
    const uptimeSeconds = Math.floor(
      (Date.now() - logger.startTime.getTime()) / 1000
    );

    // Read the last 10 lines from the log file.
    let logEntries = "";
    try {
      const logData = await readFile(config.log_file, "utf8");
      const lines = logData.split("\n").filter(Boolean);
      const lastTen = lines.slice(-10);
      logEntries = lastTen.join("\n");
    } catch (err) {
      logEntries = "Error reading log file." + err.message;
    }

    // Build the admin HTML page
    const html = `
    <html>
    <head><meta http-equiv="refresh" content="30"> <title>Admin Interface</title></head>
    <body>
    <h1>Admin Interface</h1>
    <p><strong>Total Requests:</strong> ${totalRequests}</p>
    <p><strong>Uptime:</strong>${uptimeSeconds} seconds</p>
    <h2>Last 10 Log Entries</h2>
    <pre>${logEntries}</pre>
    </body>
    </html>
    `;

    res.writeHead(200, {
      "Content-Type": "text/html",
      "content-length": Buffer.byteLength(html),
    });
    res.end(html);
  });
  server.listen(config.admin_port, config.host, () => {
    console.log(
      `Admin Interface is listening on ${config.host}:${config.admin_port}`
    );
    logger.log(
      `Admin Interface started on ${config.host}:${config.admin_port}`
    );
  });
};
