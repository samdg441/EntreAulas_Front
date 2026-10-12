import { By, PageElement } from '@serenity-js/web'

const campoReset = (etiqueta: string) =>
  PageElement.located(By.xpath(`//label[starts-with(normalize-space(.),'${etiqueta}')]/following::input[1]`))
    .describedAs(`el campo ${etiqueta}`)

export const FormularioRecuperacion = {
  correo: () => PageElement.located(By.css('input[type="email"]')).describedAs('el campo de correo'),
  enviarEnlace: () => PageElement.located(By.xpath("//button[@type='submit'][contains(normalize-space(.),'Enviar enlace de recuperación')]")).describedAs('el botón Enviar enlace'),
  tituloDeConfirmacion: () => PageElement.located(By.css('h3')).describedAs('el título de la confirmación'),
  textoDeConfirmacion: () => PageElement.located(By.css('h3 + p')).describedAs('el texto de la confirmación'),

  nuevaClave: () => campoReset('Nueva Contraseña'),
  confirmarClave: () => campoReset('Confirmar Nueva Contraseña'),
  actualizar: () => PageElement.located(By.xpath("//button[@type='submit'][contains(normalize-space(.),'Actualizar contraseña')]")).describedAs('el botón Actualizar contraseña'),
  solicitarNuevoEnlace: () => PageElement.located(By.xpath("//button[contains(normalize-space(.),'Solicitar un nuevo enlace')]")).describedAs('el botón Solicitar un nuevo enlace'),
}
