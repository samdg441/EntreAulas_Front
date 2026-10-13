# language: es
@RQ13 @web
Característica: RQ13 - Gestionar usuarios
  Como administrador
  Quiero crear, actualizar y desactivar usuarios
  Para mantener al día quién puede entrar a EntreAulas

  Antecedentes:
    Dado que Ana abre EntreAulas sin sesión en "/login"
    Y que ella ingresó con la cuenta "admin"
    Y que ella abre EntreAulas en "/admin/users"

  @exitoso
  Escenario: El administrador crea un estudiante y la clave no aparece en la lista
    Cuando ella crea un usuario "estudiante" nuevo con la clave "Clave#2026"
    Y ella busca al usuario creado
    Entonces la lista de usuarios muestra al usuario creado
    Y la lista de usuarios muestra "PRUEBA AUTOMATIZADA"
    Y la lista de usuarios no muestra "Clave#2026"

  @alternativo
  Escenario: Una clave sin mayúscula no sale del formulario
    Cuando ella crea un usuario "estudiante" nuevo con la clave "cortacorta"
    Entonces el formulario de usuario muestra el error "La contraseña debe contener al menos una letra mayúscula"

  @exitoso
  Escenario: El administrador actualiza el nombre
    Cuando ella crea un usuario "estudiante" nuevo con la clave "Clave#2026"
    Y ella busca al usuario creado
    Y ella cambia el nombre del usuario creado a "Evelia"
    Entonces la fila del usuario creado muestra "EVELIA"

  @exitoso
  Escenario: Desactiva a otro usuario
    Cuando ella crea un usuario "estudiante" nuevo con la clave "Clave#2026"
    Y ella busca al usuario creado
    Y ella desactiva al usuario creado
    Entonces la fila del usuario creado muestra "Inactivo"

  @alternativo
  Escenario: El administrador no se desactiva a sí mismo
    Cuando ella busca el usuario "rq1.admin@entreaulas.test"
    Y ella desactiva la cuenta "rq1.admin@entreaulas.test"
    Entonces ve el mensaje de error "No puedes desactivar tu propia cuenta"

  @alternativo
  Escenario: Una búsqueda sin coincidencias deja la tabla vacía
    Cuando ella busca el usuario "zzz-sin-usuarios"
    Entonces ve el texto "No hay usuarios que coincidan con los filtros"
