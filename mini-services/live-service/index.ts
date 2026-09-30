import { createLiveService, createLogger } from './server'

// Roy Live entrypoint. All realtime/room logic lives in server.ts
// (exported as createLiveService) so tests can boot isolated instances;
// this file is the thin production bootstrap.

// Hardcoded port per spec (NOT from env)
const PORT = 3003

const log = createLogger('live-service')
const service = createLiveService()

service.httpServer.listen(PORT, () => {
  log.info('Roy Live WebSocket service running', { port: PORT })
})

// ---------- Graceful shutdown ----------

function shutdown(signal: string): void {
  log.info('shutdown signal received — closing server', { signal })
  service.close().then(() => {
    log.info('server closed')
    process.exit(0)
  })
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

// Catch-all to never crash on unhandled errors
process.on('uncaughtException', (err: Error) => {
  log.error('uncaughtException', { err: err?.message ?? String(err) })
})
process.on('unhandledRejection', (reason: unknown) => {
  log.error('unhandledRejection', { err: reason instanceof Error ? reason.message : String(reason) })
})
