/**
 * Application Logger
 * 
 * Centralized logging utility with different log levels.
 * In production, can be configured to send logs to external services.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogConfig {
  enabled: boolean;
  level: LogLevel;
  logToConsole: boolean;
  // Future: Add external logging service config here
}

const config: LogConfig = {
  enabled: import.meta.env.DEV, // Only log in development by default
  level: 'info',
  logToConsole: true,
};

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Check if a log level should be output based on config
 */
function shouldLog(level: LogLevel): boolean {
  if (!config.enabled) return level === 'error'; // Always log errors
  return LOG_LEVELS[level] >= LOG_LEVELS[config.level];
}

/**
 * Format log message with timestamp and context
 */
function formatMessage(level: LogLevel, message: string, context?: Record<string, any>): string {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
}

/**
 * Logger class with different log levels
 */
export const logger = {
  /**
   * Debug-level logging (development only)
   */
  debug(message: string, context?: Record<string, any>) {
    if (shouldLog('debug') && config.logToConsole) {
      console.log(formatMessage('debug', message, context));
    }
  },

  /**
   * Info-level logging (general information)
   */
  info(message: string, context?: Record<string, any>) {
    if (shouldLog('info') && config.logToConsole) {
      console.log(formatMessage('info', message, context));
    }
  },

  /**
   * Warning-level logging (non-critical issues)
   */
  warn(message: string, context?: Record<string, any>) {
    if (shouldLog('warn') && config.logToConsole) {
      console.warn(formatMessage('warn', message, context));
    }
  },

  /**
   * Error-level logging (critical issues)
   */
  error(message: string, error?: Error | unknown, context?: Record<string, any>) {
    if (shouldLog('error') && config.logToConsole) {
      const errorDetails = error instanceof Error 
        ? { name: error.name, message: error.message, stack: error.stack }
        : { error };
      
      console.error(formatMessage('error', message, { ...errorDetails, ...context }));
    }
  },

  /**
   * Update logger configuration
   */
  configure(newConfig: Partial<LogConfig>) {
    Object.assign(config, newConfig);
  },
};

/**
 * Convenience function for logging setup/initialization messages
 */
export function logSetup(message: string, context?: Record<string, any>) {
  logger.info(`[SETUP] ${message}`, context);
}

/**
 * Convenience function for logging user actions
 */
export function logUserAction(action: string, context?: Record<string, any>) {
  logger.info(`[USER] ${action}`, context);
}
