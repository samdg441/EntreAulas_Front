import { By, PageElement } from '@serenity-js/web'

const campo = (etiqueta: string) =>
  PageElement.located(By.xpath(`//label[starts-with(normalize-space(.),'${etiqueta}')]/following::input[1]`))
    .describedAs(`el campo ${etiqueta}`)

export const FormularioCrearUsuario = {
  agregarUsuario: () => PageElement.located(By.xpath("//button[contains(normalize-space(.),'Agregar usuario')]")).describedAs('el botón Agregar usuario'),
  buscar: () => PageElement.located(By.css('input[placeholder^="Buscar"]')).describedAs('el buscador de usuarios'),
  tablaDeUsuarios: () => PageElement.located(By.css('table tbody')).describedAs('la tabla de usuarios'),
  nombre: () => campo('Nombre'),
  apellido: () => campo('Apellido'),
  correoLocal: () => PageElement.located(By.css('#correo-institucional')).describedAs('el campo de correo (sin dominio)'),
  clave: () => campo('Contraseña'),
  tipoUsuario: () => PageElement.located(By.css('#tipo-usuario')).describedAs('el selector de tipo de usuario'),
  cancelar: () => PageElement.located(By.xpath("//form//button[contains(normalize-space(.),'Cancelar')]")).describedAs('el botón Cancelar'),
  crear: () => PageElement.located(By.xpath("//form//button[@type='submit'][contains(normalize-space(.),'Crear')]")).describedAs('el botón Crear'),
  actualizar: () => PageElement.located(By.xpath("//form//button[@type='submit'][contains(normalize-space(.),'Actualizar')]")).describedAs('el botón Actualizar'),
  errorDelFormulario: () => PageElement.located(By.css('p.bg-red-50')).describedAs('el error del formulario de creación'),
  fila: (texto: string) => PageElement.located(By.xpath(`//tbody//tr[contains(.,'${texto}')]`)).describedAs(`la fila de ${texto}`),
  editarEn: (texto: string) =>
    PageElement.located(By.xpath(`//tbody//tr[contains(.,'${texto}')]//button[contains(normalize-space(.),'Editar')]`)).describedAs(`Editar a ${texto}`),
  desactivarEn: (texto: string) =>
    PageElement.located(By.xpath(`//tbody//tr[contains(.,'${texto}')]//button[contains(normalize-space(.),'Desactivar')]`)).describedAs(`Desactivar a ${texto}`),
  confirmarDesactivar: () =>
    PageElement.located(By.xpath("//div[contains(@class,'fixed') and contains(@class,'inset-0')]//button[normalize-space(.)='Desactivar']")).describedAs('confirmar desactivar'),
}
