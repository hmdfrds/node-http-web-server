import { stat, readFile, readdir } from "fs/promises";
import path, { resolve } from "path";
import { URL } from "url";
import mime from "mime";
import { safePath, httpDateFormat } from "./utils.js";
import { resolvePtr } from "dns";

/**
 * Handles an incoming HTTP request.
 * Supports GET and HEAD requests, serves static files or directory listing.
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {Object} config Loaded configuration object.
 * @param {Object} logger Logger instance.
 */
export async function handleRequest(req, res, config, logger) {
  try {
    const { method, url } = req;
    const clientIp = req.socket.remoteAddress;
    const requestLine = `${method} ${url} HTTP/${req.httpVersion}`;

    // Only GET and HEAD are allowed.
    if (method !== "GET" && method !== "HEAD") {
      res.writeHead(405, { "Content-Type": "text/html" });
      res.end("<html><body><h1>405 Mehtod Not Allowed</h1></body></html>");
      logger.logRequest(clientIp, requestLine, 405);
      return;
    }

    // Parse the URL and extract the pathname.
    const parsedUrl = new URL(url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;

    // Safely resolve the requested path relative to the document root.
    let resolvedPath;
    try {
      resolvedPath = await safePath(config.document_root, pathname);
    } catch (err) {
      res.writeHead(403, { "Content-Type": "text/html" });
      res.end("<html><body><h1>403 Forbidded</h1></body></html>");
      logger.logError(`Forbidden access from ${clientIp}: ${err}`);
      return;
    }

    // Check if the file/directory exists.
    let stats;
    try {
      stats = await stat(resolvedPath);
    } catch (err) {
      res.writeHead(404, { "Content-Type": "text/html" });
      res.end("<html><body><h1>404 Not Found</h1></body></html>");
      logger.logRequest(clientIp, requestLine, 404);
      return;
    }

    // If directory, check for index.html; otherwise, generate directory listing.
    if (stats.isDirectory()) {
      const indexPath = path.join(resolvedPath, "index.html");
      try {
        const indexStats = await stat(indexPath);
        if (indexStats.isFile()) {
          resolvedPath = indexPath;
          stats = indexStats;
        } else {
          throw new Error("index.html is not a file");
        }
      } catch {
        // Generate directory listing
        let files;
        try {
          files = await readdir(resolvedPath, { withFileTypes: true });
        } catch (err) {
          res.writeHead(500, { "Content-Type": "text/html" });
          res.end(
            "<html><body><h1>500 Internal Server Error</h1></body></html>"
          );
          logger.logError(`Error reading directory ${resolvedPath}: ${err}`);
          return;
        }
        let listing = `<html><head><title>Directory Listing</title></head><body>`;
        listing += `<h1>Directory Listing for ${pathname}</h1><ul>`;
        for (const file of files) {
          listing += `<li>${file.name}${file.isDirectory() ? "/" : ""}</li>`;
        }
        listing += "</ul></body></html>";

        res.writeHead(200, {
          "Content-Type": "text/html",
          "Content-Length": Buffer.byteLength(listing),
          Date: httpDateFormat(new Date()),
          Server: "NodeHTTP/1.0",
          Connection: "close",
        });

        if (method === "GET") {
          res.end(listing);
        } else {
          res.end();
        }
        logger.logRequest(clientIp, requestLine, 200);
        return;
      }
    }

    // Serve the file
    let fileData;
    try {
      fileData = await readFile(resolvedPath);
    } catch (err) {
      res.WriteHead(500, { "Content-Type": "text/html" });
      res.end("<html><body><h1>500 Internal Server Error</h1></body></html>");
      logger.logError(`Error reading file ${resolvedPath}: ${err}`);
      return;
    }
    // Determine the MIME time.
    const mimeType = mime.getType(resolvedPath) || "application/octet-stream";

    // Prepare headers.
    const headers = {
      "Content-Type": mimeType,
      "Content-Length": fileData.length,
      Date: httpDateFormat(new Date()),
      Server: "NodeHTTP/1.0",
      Connection: "close",
    };
    res.writeHead(200, headers);
    if (method === "GET") {
      res.end(fileData);
    } else {
      res.end();
    }
    logger.logRequest(clientIp, requestLine, 200);
  } catch (err) {
    res.writehead(500, { "Content-Type": "text/html" });
    res.end("<html><body><h1>500 Internal Server Error</h1></body></html>");
    logger.logError(`Unexpected error: ${err}`);
  }
}
