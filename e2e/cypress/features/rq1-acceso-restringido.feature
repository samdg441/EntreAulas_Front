# language: es
@RQ1 @web @error
Característica: RQ1 - Solo un administrador entra a la gestión de usuarios

  Antecedentes:
    Dado que el back de EntreAulas tiene registradas las cuentas de prueba

  Escenario: Un estudiante no puede entrar a la administración de usuarios
    Dado que Luis inició sesión con la cuenta "estudiante"
    Cuando él abre la administración de usuarios
    Entonces la ruta actual es "/forbidden"
    Y ve el mensaje "Acceso no permitido"

  Escenario: Sin sesión, la administración de usuarios lleva al login
    Dado que Luis abre EntreAulas sin sesión en "/admin/users"
    Entonces la ruta actual es "/login"
