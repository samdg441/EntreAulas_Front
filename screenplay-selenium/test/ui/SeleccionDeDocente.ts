import { By, PageElement } from '@serenity-js/web'

export const SeleccionDeDocente = {
  nuevaEvaluacion: () =>
    PageElement.located(By.xpath("//button[contains(normalize-space(.),'Nueva Evaluación')]")).describedAs('el botón Nueva Evaluación'),
  buscar: () =>
    PageElement.located(By.css('input[placeholder="Buscar profesor o curso..."]')).describedAs('el buscador de docentes'),
}
