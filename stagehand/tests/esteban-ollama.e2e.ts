import 'dotenv/config'
import { runEsteban } from '../src/esteban-scenario.js'
import { run } from '../src/run.js'

run(() => runEsteban('ollama'))
