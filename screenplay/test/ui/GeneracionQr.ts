import { By, PageElement } from '@serenity-js/web'

export const GeneracionQr = {
  confirmar: () =>
    PageElement.located(By.cssContainingText('button', 'Confirmar generación')).describedAs('el botón confirmar generación'),
}
