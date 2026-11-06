import 'dotenv/config'
import { runRfRep2532 } from '../src/rf-rep-25-32-scenario.js'
import { run } from '../src/run.js'

run(() => runRfRep2532('ollama'))
