/**
 * 结构化日志系统
 * 支持 JSON 格式输出，便于接入 ELK / Datadog / Sentry
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

export interface LogContext {
  requestId?: string
  userId?: string
  path?: string
  method?: string
  durationMs?: number
  statusCode?: number
  [key: string]: unknown
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  service: string
  env: string
  context?: LogContext
  error?: {
    name: string
    message: string
    stack?: string
  }
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  fatal: 50,
}

const SERVICE_NAME = 'baokuan-ai-factory'

function resolveMinLevel(): LogLevel {
  const env = (process.env.LOG_LEVEL || 'info').toLowerCase() as LogLevel
  return LOG_LEVEL_PRIORITY[env] !== undefined ? env : 'info'
}

const MIN_LEVEL = resolveMinLevel()
const IS_PROD = process.env.NODE_ENV === 'production'

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[MIN_LEVEL]
}

function formatEntry(entry: LogEntry): string {
  if (IS_PROD) {
    return JSON.stringify(entry)
  }
  const { timestamp, level, message, context, error } = entry
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`
  const ctxStr = context && Object.keys(context).length > 0 ? ` ${JSON.stringify(context)}` : ''
  const errStr = error ? ` error=${error.name}: ${error.message}` : ''
  return `${prefix} ${message}${ctxStr}${errStr}`
}

function emit(entry: LogEntry): void {
  if (!shouldLog(entry.level)) return
  const line = formatEntry(entry)
  if (entry.level === 'error' || entry.level === 'fatal') {
    console.error(line)
  } else if (entry.level === 'warn') {
    console.warn(line)
  } else {
    console.log(line)
  }
}

function serializeError(err: unknown): LogEntry['error'] | undefined {
  if (!err) return undefined
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack }
  }
  return { name: 'UnknownError', message: String(err) }
}

function buildEntry(level: LogLevel, message: string, context?: LogContext, err?: unknown): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    service: SERVICE_NAME,
    env: process.env.NODE_ENV || 'development',
    context,
    error: serializeError(err),
  }
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    emit(buildEntry('debug', message, context))
  },
  info(message: string, context?: LogContext): void {
    emit(buildEntry('info', message, context))
  },
  warn(message: string, context?: LogContext): void {
    emit(buildEntry('warn', message, context))
  },
  error(message: string, context?: LogContext, err?: unknown): void {
    emit(buildEntry('error', message, context, err))
  },
  fatal(message: string, context?: LogContext, err?: unknown): void {
    emit(buildEntry('fatal', message, context, err))
  },
  child(defaultContext: LogContext) {
    return {
      debug: (message: string, context?: LogContext) => logger.debug(message, { ...defaultContext, ...context }),
      info: (message: string, context?: LogContext) => logger.info(message, { ...defaultContext, ...context }),
      warn: (message: string, context?: LogContext) => logger.warn(message, { ...defaultContext, ...context }),
      error: (message: string, context?: LogContext, err?: unknown) =>
        logger.error(message, { ...defaultContext, ...context }, err),
      fatal: (message: string, context?: LogContext, err?: unknown) =>
        logger.fatal(message, { ...defaultContext, ...context }, err),
    }
  },
}

export function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}
