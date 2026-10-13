import { Interaction } from '@serenity-js/core'

import { CLAVE_VALIDA } from '../support/back-simulado'
import { paginaDe } from './NavegadorPlaywright'

const filaDe = (pagina: Awaited<ReturnType<typeof paginaDe>>, texto: string) =>
  pagina.getByRole('row', { name: new RegExp(texto, 'i') })

export const AgregarUsuario = (nombre: string, apellido: string, correo: string, clave = CLAVE_VALIDA) =>
  Interaction.where(`#actor agrega a ${nombre} ${apellido} con el correo ${correo}`, async (actor) => {
    const pagina = await paginaDe(actor)
    await pagina.getByRole('button', { name: 'Agregar usuario' }).click()
    await pagina.getByLabel('Nombre').fill(nombre)
    await pagina.getByLabel('Apellido').fill(apellido)
    await pagina.locator('#correo-institucional').fill(correo)
    await pagina.getByLabel('Contraseña').fill(clave)
    await pagina.getByRole('button', { name: 'Crear' }).click()
  })

export const DesactivarUsuario = (textoFila: string) =>
  Interaction.where(`#actor desactiva a ${textoFila}`, async (actor) => {
    const pagina = await paginaDe(actor)
    await filaDe(pagina, textoFila).getByRole('button', { name: 'Desactivar' }).click()
    await pagina.locator('.fixed.inset-0').getByRole('button', { name: 'Desactivar' }).click()
  })

export const CambiarNombre = (textoFila: string, nombre: string) =>
  Interaction.where(`#actor cambia el nombre de ${textoFila} a ${nombre}`, async (actor) => {
    const pagina = await paginaDe(actor)
    await filaDe(pagina, textoFila).getByRole('button', { name: 'Editar' }).click()
    await pagina.getByLabel('Nombre').fill(nombre)
    await pagina.getByRole('button', { name: 'Actualizar' }).click()
  })
