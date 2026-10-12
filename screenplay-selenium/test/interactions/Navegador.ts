import { Interaction } from '@serenity-js/core'
import { BrowseTheWeb } from '@serenity-js/web'

export const LimpiarSesionDelNavegador = () =>
  Interaction.where(`#actor limpia la sesión del navegador`, async actor => {
    const pagina = await BrowseTheWeb.as(actor).currentPage()
    await pagina.executeScript(() => {
      window.localStorage.clear()
      window.sessionStorage.clear()
    })
  })
