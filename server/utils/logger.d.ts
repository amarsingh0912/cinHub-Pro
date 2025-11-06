/**
 * Type definitions for logger.js
 */

export function log(message: string, source?: string): void;
export function error(message: string, source?: string, err?: Error | unknown): void;
export function warn(message: string, source?: string): void;
export function info(message: string, source?: string): void;

declare const logger: {
  log: typeof log;
  error: typeof error;
  warn: typeof warn;
  info: typeof info;
};

export default logger;
