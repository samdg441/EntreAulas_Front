const fs = require('fs')

const path = process.argv[2] || 'coverage/lcov.info'
const text = fs.readFileSync(path, 'utf8')

function hitsDe(record) {
  const lh = record.match(/^LH:(\d+)/m)
  if (lh) return Number(lh[1])
  return [...record.matchAll(/^DA:\d+,(\d+)/gm)].reduce((acc, m) => acc + Number(m[1]), 0)
}

const records = text
  .split('end_of_record')
  .map((r) => r.replace(/^SF:(.*)$/m, (_, p) => 'SF:' + String(p).trim().replace(/\\/g, '/')))
  .filter((r) => r.includes('SF:') && !r.includes('(empty-report)'))

const best = new Map()
for (const record of records) {
  const sf = (record.match(/^SF:(.*)$/m) || [])[1]
  if (!sf) continue
  const prev = best.get(sf)
  if (!prev || hitsDe(record) >= hitsDe(prev)) best.set(sf, record)
}

const kept = [...best.values()]
const out = kept.join('end_of_record') + (kept.length ? 'end_of_record\n' : '')

fs.writeFileSync(path, out)
console.log('records kept:', kept.length)
