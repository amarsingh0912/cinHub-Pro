/**
 * Centralized logging utility with Indian Standard Time (IST) timestamps
 * IST is UTC+5:30
 */

function getISTTimestamp() {
  const now = new Date();
  
  // Convert to IST (UTC+5:30)
  const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
  const istTime = new Date(now.getTime() + istOffset);
  
  // Format: YYYY-MM-DD HH:MM:SS IST
  const year = istTime.getUTCFullYear();
  const month = String(istTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istTime.getUTCDate()).padStart(2, '0');
  const hours = String(istTime.getUTCHours()).padStart(2, '0');
  const minutes = String(istTime.getUTCMinutes()).padStart(2, '0');
  const seconds = String(istTime.getUTCSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} IST`;
}

export function log(message, source = "express") {
  const timestamp = getISTTimestamp();
  console.log(`[${timestamp}] [${source}] ${message}`);
}

export function error(message, source = "express", err) {
  const timestamp = getISTTimestamp();
  console.error(`[${timestamp}] [${source}] ERROR: ${message}`);
  if (err) {
    console.error(err);
  }
}

export function warn(message, source = "express") {
  const timestamp = getISTTimestamp();
  console.warn(`[${timestamp}] [${source}] WARNING: ${message}`);
}

export function info(message, source = "express") {
  const timestamp = getISTTimestamp();
  console.info(`[${timestamp}] [${source}] INFO: ${message}`);
}

export default {
  log,
  error,
  warn,
  info,
};
