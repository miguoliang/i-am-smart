/**
 * Logger utility for consistent logging across the application.
 * Replaces console.log, console.error, etc. with a centralized logging system.
 *
 * In development, logs are output to the console.
 * In production, logs can be sent to a logging service.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";

  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.isDevelopment && level === "debug") {
      return; // Skip debug logs in production
    }

    switch (level) {
      case "debug":
        console.debug(`[DEBUG] ${message}`, context || "");
        break;
      case "info":
        console.info(`[INFO] ${message}`, context || "");
        break;
      case "warn":
        console.warn(`[WARN] ${message}`, context || "");
        break;
      case "error":
        console.error(`[ERROR] ${message}`, context || "");
        break;
    }

    // In production, you could send logs to a logging service here
    // Example: sendToLoggingService(logEntry);
  }

  debug(message: string, context?: LogContext): void {
    this.log("debug", message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log("info", message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log("warn", message, context);
  }

  error(message: string, context?: LogContext): void {
    this.log("error", message, context);
  }
}

export const logger = new Logger();
