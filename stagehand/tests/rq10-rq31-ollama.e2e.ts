import 'dotenv/config'
import { runRq10Rq31 } from '../src/rq10-rq31-scenario.js'
import { run } from '../src/run.js'

run(() => runRq10Rq31('ollama'))
