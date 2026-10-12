# language: es
@RQ1 @web @alternativo
Característica: RQ1 - Acceso restringido a la gestión de usuarios

  Escenario: Un estudiante no puede entrar a la administración de usuarios
    Dado que Luis abre EntreAulas sin sesión en "/login"
    Y que él ingresó con la cuenta "estudiante"
    Cuando él abre EntreAulas en "/admin/users"
    Entonces la ruta actual no es "/admin/users"
