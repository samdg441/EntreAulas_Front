import type { Page } from '@browserbasehq/stagehand'
import { frontUrl } from './config.js'

export type UsuarioIa = {
  id: string
  nombre: string
  apellido: string
  email: string
  tipo_usuario: string
  roles: string[]
}

export const estudianteIa: UsuarioIa = {
  id: 'u-est',
  nombre: 'Eva',
  apellido: 'Estudiante',
  email: 'eva.estudiante@soyudemedellin.edu.co',
  tipo_usuario: 'estudiante',
  roles: ['estudiante'],
}

export const adminIa: UsuarioIa = {
  id: 'u-admin',
  nombre: 'Ada',
  apellido: 'Admin',
  email: 'ada.admin@udemedellin.edu.co',
  tipo_usuario: 'admin',
  roles: ['admin'],
}

/**
 * El front usa Axios (XHR). El navegador no deja reescribir status en un XHR real,
 * y un status 0 se convierte en "Network Error". Esta clase responde /api/ sin red.
 */
const BACK_SIMULADO = `(() => {
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
  const qr = {
    profesorId: 13,
    profesorNombre: 'Ana Pérez',
    cursoId: 12,
    cursoNombre: 'Programación I',
    cursoCodigo: 'SIS-101',
    grupoId: 63,
  }

  const simular = (url) => {
    const destino = String(url || '')
    if (!destino.includes('/api/') && !destino.includes('localhost:3000')) return null
    if (destino.includes('/auto-enroll')) return { status: 201, body: { enrolled: true, created: true, grupoId: 63 } }
    if (destino.includes('/api/qr-evaluaciones/tok-14')) return { status: 200, body: qr }
    if (destino.includes('student-enrolled-subjects')) return { status: 200, body: { materiasMatriculadas: [materia], total: 1 } }
    if (destino.includes('student-stats')) {
      return {
        status: 200,
        body: {
          evaluacionesCompletadas: 1,
          evaluacionesPendientes: 0,
          materiasMatriculadas: 1,
          promedioGeneral: 4,
          progresoGeneral: 50,
        },
      }
    }
    if (destino.includes('academic-structure')) return { status: 200, body: { facultades: [] } }
    if (destino.includes('student-info')) return { status: 200, body: { nombre: 'Eva', apellido: 'Estudiante' } }
    if (destino.includes('evaluation-questions')) return { status: 200, body: { questions: [] } }
    return { status: 200, body: {} }
  }

  class FakeXHR extends EventTarget {
    constructor() {
      super()
      this.readyState = 0
      this.status = 0
      this.statusText = ''
      this.responseText = ''
      this.response = ''
      this.responseType = ''
      this.responseURL = ''
      this.timeout = 0
      this.withCredentials = false
      this.upload = new EventTarget()
      this.onreadystatechange = null
      this.onload = null
      this.onerror = null
      this.ontimeout = null
      this.onabort = null
      this.onloadend = null
      this.onloadstart = null
      this._url = ''
      this._method = 'GET'
    }
    open(method, url) {
      this._method = method
      this._url = String(url)
      this.readyState = 1
    }
    setRequestHeader() {}
    getResponseHeader(header) {
      return String(header).toLowerCase() === 'content-type' ? 'application/json' : null
    }
    getAllResponseHeaders() {
      return 'content-type: application/json\\r\\n'
    }
    abort() {}
    send() {
      const respuesta = simular(this._url)
      window.__eaApi = (window.__eaApi || '') + this._method + ' ' + this._url + ' -> ' + (respuesta ? respuesta.status : 'sin-mock') + '\\n'
      if (!respuesta) {
        this.status = 0
        if (typeof this.onerror === 'function') this.onerror(new ProgressEvent('error'))
        return
      }
      const text = JSON.stringify(respuesta.body)
      this.status = respuesta.status
      this.statusText = 'OK'
      this.readyState = 4
      this.responseText = text
      this.response = text
      this.responseURL = this._url
      const done = new ProgressEvent('loadend')
      setTimeout(() => {
        if (typeof this.onreadystatechange === 'function') this.onreadystatechange(new Event('readystatechange'))
        if (typeof this.onload === 'function') this.onload(new ProgressEvent('load'))
        if (typeof this.onloadend === 'function') this.onloadend(done)
      }, 0)
    }
  }

  window.XMLHttpRequest = FakeXHR
  const fetchOriginal = window.fetch.bind(window)
  window.fetch = (input, init) => {
    const url = typeof input === 'string' ? input : input && input.url
    const respuesta = simular(url)
    if (!respuesta) return fetchOriginal(input, init)
    window.__eaApi = (window.__eaApi || '') + 'FETCH ' + url + ' -> ' + respuesta.status + '\\n'
    return Promise.resolve(new Response(JSON.stringify(respuesta.body), {
      status: respuesta.status,
      headers: { 'Content-Type': 'application/json' },
    }))
  }
  window.__backSimulado = 'listo'
})()`

export async function instalarBackSimulado(page: Page): Promise<void> {
  await page.addInitScript(BACK_SIMULADO)
}

export async function fijarSesion(page: Page, usuario: UsuarioIa | null): Promise<void> {
  const actual = await page.url()
  if (!actual.startsWith(frontUrl())) {
    await page.goto(`${frontUrl()}/login`, { waitUntil: 'domcontentloaded' })
  }
  await page.evaluate((user) => {
    if (!user) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      return
    }
    localStorage.setItem('token', 'token-e2e')
    localStorage.setItem('user', JSON.stringify(user))
  }, usuario)
}

export async function textoDe(page: Page): Promise<string> {
  return page.evaluate(() => document.body.innerText)
}

export async function rutaDe(page: Page): Promise<string> {
  return new URL(await page.url()).pathname
}
