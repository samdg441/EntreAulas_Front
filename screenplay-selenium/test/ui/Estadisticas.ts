import { By, PageElement } from '@serenity-js/web'

export const Estadisticas = {
  valor: (titulo: string) =>
    PageElement.located(By.xpath(
      `//*[normalize-space(.)='${titulo}']/ancestor::*[contains(@class,'shadow-md')][1]//*[contains(@class,'text-3xl')]`,
    )).describedAs(`el valor de ${titulo}`),
}
