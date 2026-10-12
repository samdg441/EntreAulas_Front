# language: es
@RQ1 @web
Característica: RQ1 - Registro de usuarios por el administrador
  Como administrador
  Quiero crear cuentas institucionales
  Para que estudiantes y docentes puedan ingresar a EntreAulas

  Antecedentes:
    Dado que Ana abre EntreAulas sin sesión en "/login"
    Y que ella ingresó con la cuenta "admin"
    Y que ella abre EntreAulas en "/admin/users"

  @exitoso
  Escenario: El administrador crea un estudiante y aparece en la lista
    Cuando ella crea un usuario "estudiante" nuevo con la clave "Clave#2026"
    Y ella busca al usuario creado
    Entonces la lista de usuarios muestra al usuario creado

  @exitoso
  Escenario: El administrador crea un docente
    Cuando ella crea un usuario "profesor" nuevo con la clave "Clave#2026"
    Y ella busca al usuario creado
    Entonces la lista de usuarios muestra al usuario creado

  @alternativo
  Escenario: No se puede registrar un correo que ya existe
    Dado que existe el usuario "estudiante" registrado por API
    Cuando ella crea un usuario con el mismo correo y la clave "Clave#2026"
    Entonces el formulario de usuario muestra el error "ya está registrado"

  @alternativo
  Escenario: No se crea el usuario si la clave tiene menos de 8 caracteres
    Cuando ella crea un usuario "estudiante" nuevo con la clave "Ab#1"
    Entonces el formulario de creación sigue abierto
    Y el usuario creado no existe en la lista
