import { Activity } from '../actor'
import { FormularioAltaUsuario } from '../ui'

const actividad = (descripcion: string, performAs: () => void): Activity => ({ descripcion, performAs })

export const AbrirDirecto = {
  la: (ruta: string): Activity => ({
    descripcion: `abre ${ruta} con la sesión ya iniciada`,
    performAs: () => {
      cy.window().its('localStorage.token', { timeout: 15_000 }).should('match', /^jwt-/)
      cy.visit(ruta)
    },
  }),
}

export const AbrirNuevaEvaluacion = actividad('abre una nueva evaluación', () => {
  cy.contains('button', 'Nueva Evaluación', { timeout: 15_000 }).click()
})

export const EnviarEvaluacion = {
  conComentario: (comentario: string) =>
    actividad(`envía la evaluación con «${comentario}»`, () => {
      cy.contains('h3', 'Ana Pérez').click()
      cy.get('select').select('Programación I (SIS-101)')
      cy.contains('Grupo 1', { timeout: 10_000 }).click()
      cy.contains('button', 'Continuar a Evaluación').click()
      cy.contains('Claridad Expositiva', { timeout: 15_000 }).should('be.visible')
      cy.contains('Claridad Expositiva').parents('.space-y-4').first().contains('span', /^5$/).click()
      cy.get('textarea[placeholder="Escribe tus comentarios aquí..."]').type(comentario)
      cy.contains('button', 'Finalizar Evaluación').click()
      cy.contains('button', 'Confirmar y Enviar').click()
    }),
}

export const GenerarResumen = actividad('genera el resumen de IA', () => {
  cy.contains('button', 'Generar resumen IA', { timeout: 15_000 }).click()
})

export const AgregarUsuario = {
  con: (nombre: string, apellido: string, correo: string, clave: string) =>
    actividad(`agrega a ${nombre} ${apellido}`, () => {
      cy.contains('button', FormularioAltaUsuario.abrir).click()
      cy.get(FormularioAltaUsuario.nombre).clear().type(nombre)
      cy.get(FormularioAltaUsuario.apellido).clear().type(apellido)
      cy.get(FormularioAltaUsuario.usuarioDelCorreo).clear().type(correo)
      cy.get(FormularioAltaUsuario.clave).clear().type(clave, { log: false })
      cy.contains('button', FormularioAltaUsuario.crear).click()
    }),
}

export const CambiarNombre = {
  de: (fila: string, nombre: string) =>
    actividad(`cambia el nombre de ${fila} a ${nombre}`, () => {
      cy.contains('tr', fila).contains('button', 'Editar').click()
      cy.get(FormularioAltaUsuario.nombre).clear().type(nombre)
      cy.contains('button', 'Actualizar').click()
    }),
}

export const DesactivarUsuario = {
  a: (fila: string) =>
    actividad(`desactiva a ${fila}`, () => {
      cy.contains('tr', fila).contains('button', 'Desactivar').click()
      cy.get('.fixed.inset-0').contains('button', 'Desactivar').click()
    }),
}

export const BuscarUsuario = {
  llamado: (texto: string) =>
    actividad(`busca «${texto}»`, () => {
      cy.get('input[placeholder="Buscar por nombre, email o rol…"]').clear().type(texto)
    }),
}

export const VerEstadistica = {
  titulada: (titulo: string, valor: string) =>
    actividad(`la estadística ${titulo} muestra ${valor}`, () => {
      cy.contains(titulo, { timeout: 10_000 }).closest('.bg-white').should('contain', valor)
    }),
}
