import { By, PageElement } from '@serenity-js/web'

export const Mensajes = {
  error: () => PageElement.located(By.css('div.bg-red-50, p.bg-red-50, p.text-red-600')).describedAs('el mensaje de error'),
}
