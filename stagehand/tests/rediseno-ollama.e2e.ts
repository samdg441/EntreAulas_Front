import 'dotenv/config'
import { run } from '../src/run.js'
import { runRediseno } from '../src/rediseno-scenario.js'

/** Rediseño del coordinador (auditoría, preferencias y gestión de profesores) con Stagehand + Ollama. */
run(() => runRediseno('ollama'))
