import 'dotenv/config'
import { runLoginScenario } from '../src/login-scenario.js'
import { run } from '../src/run.js'

/** RQ19 — Login con Ollama local (act + aserción determinística de la ruta). */
run(() => runLoginScenario('ollama'))
