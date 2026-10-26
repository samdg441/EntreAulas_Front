import 'dotenv/config'
import { runRq6Rq27 } from '../src/rq6-rq27-scenario.js'
import { run } from '../src/run.js'

run(() => runRq6Rq27('ollama'))
