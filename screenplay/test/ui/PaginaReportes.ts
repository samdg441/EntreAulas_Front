import { By, PageElement } from '@serenity-js/web'

/** Lean Page Object de /reports. */
export const PaginaReportes = {
  periodo: () => PageElement.located(By.css('select[aria-label="Periodo"]')).describedAs('el selector de periodo'),
  datosExcel: () => PageElement.located(By.cssContainingText('button', 'Datos Excel')).describedAs('el botón Datos Excel'),
}
