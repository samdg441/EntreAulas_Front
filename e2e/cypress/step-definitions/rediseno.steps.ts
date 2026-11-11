import { Given, Then, When } from '@badeball/cypress-cucumber-preprocessor'
import { actorLlamado } from './elenco'
import { registrarRutasCoordinador } from '../support/rediseno'
import {
  AbrirLaAuditoria,
  AbrirLaGestionDeProfesores,
  AbrirLasPreferencias,
  ElegirPreferencias,
  FiltrarDocentesEnRiesgo,
  FiltrarLaAuditoriaPor,
} from '../screenplay/tasks/rediseno'
import { AtributoDeLaPagina, DiasDelCalendario, DocentesListados, EventosDeAuditoria, IndicadorDelPanel, SeccionDeLaBarra } from '../screenplay/questions/rediseno'

const ACTOR = '(Eva|Lía|Ada|Pedro|Carlos|Dora|ella|él)'

Given('que el back responde el panel del coordinador con docentes, una evaluación programada y eventos de auditoría', () => {
  registrarRutasCoordinador()
})

When(new RegExp(`^${ACTOR} abre la auditoría desde la barra lateral$`), (nombre: string) => {
  actorLlamado(nombre).attemptsTo(AbrirLaAuditoria)
})

When(new RegExp(`^${ACTOR} filtra la auditoría por la acción "([^"]*)"$`), (nombre: string, accion: string) => {
  actorLlamado(nombre).attemptsTo(FiltrarLaAuditoriaPor.accion(accion))
})

When(new RegExp(`^${ACTOR} abre la gestión de profesores$`), (nombre: string) => {
  actorLlamado(nombre).attemptsTo(AbrirLaGestionDeProfesores)
})

When(new RegExp(`^${ACTOR} filtra a los docentes en riesgo$`), (nombre: string) => {
  actorLlamado(nombre).attemptsTo(FiltrarDocentesEnRiesgo)
})

When(new RegExp(`^${ACTOR} elige el modo "([^"]*)", el idioma "([^"]*)" y la letra "([^"]*)"$`), (nombre: string, modo: string, idioma: string, letra: string) => {
  actorLlamado(nombre).attemptsTo(AbrirLasPreferencias, ElegirPreferencias.modo(modo), ElegirPreferencias.idioma(idioma), ElegirPreferencias.letra(letra))
  cy.get('body').type('{esc}')
})

Then(new RegExp(`^${ACTOR} ve el indicador "([^"]*)" con el valor "([^"]*)"$`), (nombre: string, indicador: string, valor: string) => {
  actorLlamado(nombre).asksFor(IndicadorDelPanel.llamado(indicador)).should('contain', valor)
})

Then(new RegExp(`^${ACTOR} ve en la barra lateral la sección "([^"]*)" con el enlace "([^"]*)"$`), (nombre: string, seccion: string, enlace: string) => {
  actorLlamado(nombre).asksFor(SeccionDeLaBarra.con(seccion, enlace)).should('eq', true)
})

Then(new RegExp(`^${ACTOR} ve en el calendario un día de apertura y un día de cierre de la evaluación$`), (nombre: string) => {
  actorLlamado(nombre).asksFor(DiasDelCalendario.conLimites()).should('eq', true)
})

Then('la auditoría lista {int} evento(s)', (cantidad: number) => {
  actorLlamado('él').asksFor(EventosDeAuditoria.listados()).should('eq', cantidad)
})

Then('la lista de docentes muestra a {string}', (docente: string) => {
  actorLlamado('él').asksFor(DocentesListados.incluye(docente)).should('eq', true)
})

Then('la lista de docentes no muestra a {string}', (docente: string) => {
  actorLlamado('él').asksFor(DocentesListados.incluye(docente)).should('eq', false)
})

Then('la página está en modo noche', () => {
  actorLlamado('él').asksFor(AtributoDeLaPagina.tieneClase('dark')).should('eq', true)
})

Then('el idioma de la página es {string}', (idioma: string) => {
  actorLlamado('él').asksFor(AtributoDeLaPagina.html('lang')).should('eq', idioma)
})
