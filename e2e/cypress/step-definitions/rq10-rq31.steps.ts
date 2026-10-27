import { Given, Then, When } from '@badeball/cypress-cucumber-preprocessor'
import { actorLlamado, backSimulado } from './elenco'
import {
  AbrirDirecto,
  AbrirNuevaEvaluacion,
  AgregarUsuario,
  BuscarUsuario,
  CambiarNombre,
  DesactivarUsuario,
  EnviarEvaluacion,
  GenerarResumen,
  VerEstadistica,
} from '../screenplay/tasks/rq10-rq31'

const CLAVE = 'Clave-Segura2026!'
const ACTOR = '(Eva|Lía|Ada|Pedro|Carlos|Dora|ella|él)'

const CUENTAS = [
  { email: 'eva.estudiante@soyudemedellin.edu.co', tipo_usuario: 'estudiante', nombre: 'Eva', apellido: 'Estudiante' },
  { email: 'lia.estudiante@soyudemedellin.edu.co', tipo_usuario: 'estudiante', nombre: 'Lía', apellido: 'Estudiante' },
  { email: 'ada.admin@udemedellin.edu.co', tipo_usuario: 'admin', nombre: 'Ada', apellido: 'Admin' },
  { email: 'pedro.docente@udemedellin.edu.co', tipo_usuario: 'profesor', nombre: 'Pedro', apellido: 'Docente' },
  { email: 'carlos.coordinador@udemedellin.edu.co', tipo_usuario: 'coordinador', nombre: 'Carlos', apellido: 'Coordinador' },
  { email: 'dora.decano@udemedellin.edu.co', tipo_usuario: 'decano', nombre: 'Dora', apellido: 'Decano' },
]

Given('que el back de EntreAulas tiene las cuentas de los requisitos 10 a 31', () => {
  CUENTAS.forEach((cuenta) => backSimulado().estado.sembrar({ ...cuenta, password: CLAVE }))
})

When(new RegExp(`^${ACTOR} abre directamente "([^"]*)"$`), (nombre: string, ruta: string) => {
  actorLlamado(nombre).attemptsTo(AbrirDirecto.la(ruta))
})

When(new RegExp(`^${ACTOR} abre una nueva evaluación$`), (nombre: string) => {
  actorLlamado(nombre).attemptsTo(AbrirNuevaEvaluacion)
})

When(new RegExp(`^${ACTOR} envía la evaluación con el comentario "([^"]*)"$`), (nombre: string, comentario: string) => {
  actorLlamado(nombre).attemptsTo(EnviarEvaluacion.conComentario(comentario))
})

When(new RegExp(`^${ACTOR} genera el resumen de IA$`), (nombre: string) => {
  actorLlamado(nombre).attemptsTo(GenerarResumen)
})

When(new RegExp(`^${ACTOR} agrega a "([^"]*)" "([^"]*)" con el correo "([^"]*)"$`), (nombre: string, pila: string, apellido: string, correo: string) => {
  actorLlamado(nombre).attemptsTo(AgregarUsuario.con(pila, apellido, correo, CLAVE))
})

When(
  new RegExp(`^${ACTOR} intenta agregar a "([^"]*)" "([^"]*)" con el correo "([^"]*)" y la clave "([^"]*)"$`),
  (nombre: string, pila: string, apellido: string, correo: string, clave: string) => {
    actorLlamado(nombre).attemptsTo(AgregarUsuario.con(pila, apellido, correo, clave))
  },
)

When(new RegExp(`^${ACTOR} cambia el nombre de "([^"]*)" a "([^"]*)"$`), (nombre: string, fila: string, nuevo: string) => {
  actorLlamado(nombre).attemptsTo(CambiarNombre.de(fila, nuevo))
})

When(new RegExp(`^${ACTOR} desactiva a "([^"]*)"$`), (nombre: string, fila: string) => {
  actorLlamado(nombre).attemptsTo(DesactivarUsuario.a(fila))
})

When(new RegExp(`^${ACTOR} busca el usuario "([^"]*)"$`), (nombre: string, texto: string) => {
  actorLlamado(nombre).attemptsTo(BuscarUsuario.llamado(texto))
})

Then('la estadística {string} muestra {string}', (titulo: string, valor: string) => {
  actorLlamado('ella').attemptsTo(VerEstadistica.titulada(titulo, valor))
})

Then('ella ve a {string} como {string}', (fila: string, estado: string) => {
  cy.contains('tr', fila).contains(estado).should('be.visible')
})
