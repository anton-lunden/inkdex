const level = process.env.LOG_LEVEL ?? "info";

const levels: Record<string, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const threshold = levels[level] ?? 1;

// All levels go to stderr to keep stdout free for the MCP stdio transport
function log(lvl: string, msg: string): void {
  if ((levels[lvl] ?? 0) >= threshold) {
    console.error(`[${lvl.toUpperCase()}] ${msg}`);
  }
}

export const logger = {
  debug: (msgOrObj: string | Record<string, unknown>, msg?: string) =>
    log("debug", formatMsg(msgOrObj, msg)),
  info: (msgOrObj: string | Record<string, unknown>, msg?: string) =>
    log("info", formatMsg(msgOrObj, msg)),
  warn: (msgOrObj: string | Record<string, unknown>, msg?: string) =>
    log("warn", formatMsg(msgOrObj, msg)),
  error: (msgOrObj: string | Record<string, unknown>, msg?: string) =>
    log("error", formatMsg(msgOrObj, msg)),
};

function formatMsg(
  msgOrObj: string | Record<string, unknown>,
  msg?: string,
): string {
  if (typeof msgOrObj === "string") return msgOrObj;
  const data = Object.entries(msgOrObj)
    .map(([k, v]) => `${k}=${v}`)
    .join(" ");
  return msg ? `${msg} ${data}` : data;
}
