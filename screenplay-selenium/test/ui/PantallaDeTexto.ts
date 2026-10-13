import { By, PageElement } from '@serenity-js/web'

export const PantallaDeTexto = {
  exacto: (texto: string) =>
    PageElement.located(By.xpath(`//*[normalize-space(.)='${texto}']`)).describedAs(`el texto "${texto}"`),
}
