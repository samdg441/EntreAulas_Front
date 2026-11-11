import 'dotenv/config'
import { run } from '../src/run.js'
import { selectedProvider } from '../src/config.js'
import { runRediseno } from '../src/rediseno-scenario.js'

/** Rediseño del coordinador (auditoría, preferencias y gestión de profesores) con Stagehand; el proveedor sale de AI_PROVIDER (ollama o gemini). */
run(() => runRediseno(selectedProvider()))
