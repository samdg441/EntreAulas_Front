import { By, PageElement } from '@serenity-js/web'

export const FormularioLogin = {
  selectorTipo: () => PageElement.located(By.css('form button[type="button"]')).describedAs('el selector de tipo de usuario'),
  opcionTipo: (etiqueta: string) =>
    PageElement.located(By.xpath(`//form//*[contains(@class,'absolute')]//button[contains(normalize-space(.),'${etiqueta}')]`)).describedAs(`la opción "${etiqueta}"`),
  correo: () => PageElement.located(By.css('input[type="email"]')).describedAs('el campo de correo institucional'),
  clave: () => PageElement.located(By.css('input[type="password"]')).describedAs('el campo de contraseña'),
  ingresar: () => PageElement.located(By.css('form button[type="submit"]')).describedAs('el botón Iniciar sesión'),
  olvideMiClave: () => PageElement.located(By.xpath("//button[contains(normalize-space(.),'¿Olvidaste tu contraseña?')]")).describedAs('el enlace "¿Olvidaste tu contraseña?"'),
}
