import { readFileSync } from "fs";
export const loadConfig = (configPath = "./config.json") => {
  try {
    const data = readFileSync(configPath, "utf8");
    const config = JSON.parse(data);

    // List of required configuraiton fields
    const requiredFields = [
      "host",
      "port",
      "admin_port",
      "document_root",
      "max_threads",
      "log_file",
    ];

    requiredFields.forEach((field) => {
      if (!config[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    });
    return config;
  } catch (error) {
    console.error("Error loading configuration:", error.message);
    process.exit(1);
  }
};
