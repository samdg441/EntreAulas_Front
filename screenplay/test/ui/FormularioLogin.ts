import { By, PageElement } from '@serenity-js/web'

/** Lean Page Object de /login: solo localizadores, sin acciones. */
export const FormularioLogin = {
  formulario: () => PageElement.located(By.css('form')).describedAs('el formulario de inicio de sesión'),
  selectorTipo: () => PageElement.located(By.css('form button[type="button"]')).describedAs('el selector de tipo de usuario'),
  opcionTipo: (etiqueta: string) =>
    PageElement.located(By.cssContainingText('form .absolute button', etiqueta)).describedAs(`la opción "${etiqueta}"`),
  correo: () => PageElement.located(By.css('input[type="email"]')).describedAs('el campo de correo institucional'),
  clave: () => PageElement.located(By.css('input[type="password"]')).describedAs('el campo de contraseña'),
  ingresar: () => PageElement.located(By.css('form button[type="submit"]')).describedAs('el botón Iniciar sesión'),
}
