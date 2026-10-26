const materia = {
  id: 11,
  grupo: {
    numeroGrupo: 1,
    horario: 'Lun 8-10',
    aula: 'A-101',
    curso: { id: 31, codigo: 'SIS-101', nombre: 'Programación I' },
    profesor: { nombre: 'Ana Pérez' },
    periodo: { codigo: '2026-1', nombre: '2026-I' },
  },
}

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  const url = event.request.url
  if (!url.includes('localhost:3000/api/')) return

  let body = {}
  if (url.includes('student-enrolled-subjects')) body = { materiasMatriculadas: [materia], total: 1 }
  else if (url.includes('student-stats')) {
    body = {
      evaluacionesCompletadas: 1,
      evaluacionesPendientes: 0,
      materiasMatriculadas: 1,
      promedioGeneral: 4,
      progresoGeneral: 50,
    }
  }

  event.respondWith(
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  )
})
