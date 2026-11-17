/*
 * Back simulado para las pruebas de Healenium de Esteban (punto 14).
 * El Chrome de Selenium Grid corre en Docker y no llega al back del equipo (localhost:3000):
 * este service worker responde las llamadas de Creación de encuestas y Selección de la encuesta.
 * Solo se registra desde healenium/tests/esteban-encuestas.e2e.ts.
 */
const PREGUNTAS = [
  { id: 8, categoria_id: 1, texto_pregunta: 'El docente explica con claridad', descripcion: '', tipo_pregunta: 'likert', obligatoria: true, orden: 1, activa: true, id_carrera: null },
  { id: 9, categoria_id: 1, texto_pregunta: 'El docente llega a tiempo', descripcion: '', tipo_pregunta: 'likert', obligatoria: true, orden: 2, activa: true, id_carrera: null },
]
const DOCENTES = [
  {
    id: '7',
    name: 'Ana Ruiz',
    department: 'Sistemas',
    email: 'ana@udem.edu.co',
    courses: [{ id: 'c1', name: 'Bases de datos', code: 'BD-101', schedule: 'Lunes 8:00' }],
  },
]

self.addEventListener('install', (event) => event.waitUntil(self.skipWaiting()))
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

function responder(body) {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

self.addEventListener('fetch', (event) => {
  const { url, method } = event.request
  if (!url.includes('localhost:3000/api/')) return
  const ruta = new URL(url).pathname

  let body = {}
  if (ruta === '/api/evaluations/categories') body = { categories: [{ id: 1, nombre: 'Docencia', descripcion: '', orden: 1 }] }
  else if (ruta === '/api/evaluations/questions' && method === 'GET') body = { success: true, data: PREGUNTAS }
  else if (/^\/api\/evaluations\/questions\/\d+$/.test(ruta) && method === 'PUT') body = { success: true, data: PREGUNTAS[0] }
  else if (ruta === '/api/users/academic-structure') body = { facultades: [] }
  else if (/^\/api\/teachers\/[^/]+\/courses\/[^/]+\/groups$/.test(ruta)) body = [{ id: 'g1', numero_grupo: '01' }]
  else if (ruta === '/api/teachers') body = DOCENTES
  else if (ruta === '/api/periodos/evaluacion') body = []

  event.respondWith(responder(body))
})
