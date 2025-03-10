import path from "path";

/**
 * Safely resolves a requested file path relative to the document root.
 * @param {string} documentRoot The root directory from which files are served.
 * @param {string} requestPath The URL path requested
 * @returns {Error} If the resolved path is outside the document root.
 */
export const safePath = (documentRoot, requestPath) => {
  const sanitizedPath = requestPath.replace(/^\/+/, "");
  const resolvedPath = path.resolve(documentRoot, sanitizedPath);
  const documentRootAbs = path.resolve(documentRoot);

  // Check if the resolved path is within the document root.
  if (!resolvedPath.startsWith(documentRootAbs)) {
    throw new Error("Access denied: directory traversal attempt detected.");
  }
  return resolvedPath;
};

/**
 * Formats a Date objects into an HTTP-date string.
 * Example output: "Tue 10 Mar 2024 08:37:00 GMT"
 * @param {Date} date The date to format.
 * @returns {string} The formatted HTTP-date string.
 */
export const httpDateFormat = (date) => date.toUTCString();
