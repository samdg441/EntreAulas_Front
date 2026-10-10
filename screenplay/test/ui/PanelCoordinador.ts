import { By, PageElement, PageElements } from '@serenity-js/web'

/** Lean Page Object de /dashboard-coordinador. */
export const PanelCoordinador = {
  buscador: () =>
    PageElement.located(By.css('input[placeholder="Buscar por nombre o correo..."]')).describedAs('el buscador de docentes'),
  tabla: () => PageElement.located(By.css('tbody')).describedAs('la tabla de docentes'),
  nombresDocentes: () => PageElements.located(By.css('tbody tr td.font-medium')).describedAs('los nombres de los docentes'),
  promedioDe: (docente: string) =>
    PageElement.located(By.css('td:nth-child(4)'))
      .of(PageElement.located(By.cssContainingText('tbody tr', docente)))
      .describedAs(`el promedio de ${docente}`),
}
