import { By, PageElement } from '@serenity-js/web'

export const FormularioUsuarios = {
  buscar: () =>
    PageElement.located(By.css('input[placeholder="Buscar por nombre, email o rol…"]')).describedAs('el buscador de usuarios'),
}
