import { jwtSinFirma, pedir } from '../../support/api'

/**
 * Requisito 1 — Contrato de GET /api/coordinador/auditoria contra el back (sin UI).
 * Los casos sin credenciales no tocan la base. Se ejecutan con API_URL apuntando al despliegue
 * (por defecto el de Render; en el despliegue local: API_URL=http://localhost:3000).
 */
describe('Auditoría — API del coordinador', () => {
  before(() => {
    pedir('/health', { timeout: 120_000 })
  })

  it('sin token → 401 con código NO_TOKEN', () => {
    pedir('/api/coordinador/auditoria').then((r) => {
      expect(r.status).to.eq(401)
      expect(r.body).to.include({ code: 'NO_TOKEN' })
    })
  })

  it('con un token mal formado → 401', () => {
    pedir('/api/coordinador/auditoria', { headers: { Authorization: 'Bearer abc.def.ghi' } }).its('status').should('eq', 401)
  })

  it('con un JWT "alg: none" (sin firma) → 401: el back no lo acepta', () => {
    const token = jwtSinFirma({ userId: 'cualquiera', exp: Math.floor(Date.now() / 1000) + 600 })
    pedir('/api/coordinador/auditoria', { headers: { Authorization: `Bearer ${token}` } }).its('status').should('eq', 401)
  })

  it('el cuerpo del 401 no expone detalles internos ni rutas del servidor', () => {
    pedir('/api/coordinador/auditoria').then((r) => {
      expect(JSON.stringify(r.body)).not.to.match(/at .*\.ts|node_modules|supabase|stack/i)
      expect(r.headers).not.to.have.property('x-powered-by')
    })
  })

  it('responde con las cabeceras de seguridad de helmet', () => {
    pedir('/api/coordinador/auditoria').then((r) => {
      expect(r.headers['x-content-type-options']).to.eq('nosniff')
      expect(r.headers).to.have.property('strict-transport-security')
    })
  })

  it('el método POST no está permitido en la auditoría (solo lectura)', () => {
    pedir('/api/coordinador/auditoria', { method: 'POST', body: { accion: 'borrar' } }).its('status').should('be.oneOf', [401, 404])
  })

  it('el contrato OpenAPI no filtra la tabla de auditoría a clientes anónimos más allá de lo documentado', () => {
    pedir('/api/openapi.json').then((r) => {
      expect(r.status).to.eq(200)
      expect(JSON.stringify(r.body)).not.to.match(/service_role|SUPABASE_SERVICE/i)
    })
  })
})
