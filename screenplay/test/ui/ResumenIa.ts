import { By, PageElement } from '@serenity-js/web'

export const ResumenIa = {
  generar: () =>
    PageElement.located(By.cssContainingText('button', 'Generar resumen IA')).describedAs('el botón Generar resumen IA'),
}
