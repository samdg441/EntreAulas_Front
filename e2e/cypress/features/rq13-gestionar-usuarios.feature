# language: es
@web @RQ13
Característica: RQ13 - Gestionar usuarios
  Como administrador
  Quiero crear, actualizar y desactivar usuarios
  Para mantener al día quién puede entrar a EntreAulas

  Antecedentes:
    Dado que el back de EntreAulas tiene las cuentas de los requisitos 10 a 31
    Y Ada inicia sesión como "admin" con "ada.admin@udemedellin.edu.co" y la clave "Clave-Segura2026!"
    Y ella abre directamente "/admin/users"

  @smoke
  Escenario: El administrador ve la lista y crea un estudiante
    Entonces ella ve el mensaje "eva.estudiante@soyudemedellin.edu.co"
    Cuando ella agrega a "Luis" "Gomez" con el correo "luis"
    Entonces ella ve el mensaje "LUIS GOMEZ"
    Y ella ve el mensaje "luis@soyudemedellin.edu.co"
    Y ella no ve el mensaje "Clave-Segura2026!"

  Escenario: Un correo ya registrado no crea otro usuario
    Cuando ella agrega a "Eva" "Estudiante" con el correo "eva.estudiante"
    Entonces ella ve el mensaje "El email ya está registrado"

  Escenario: Una clave sin mayúscula no sale del formulario
    Cuando ella intenta agregar a "Ana" "Perez" con el correo "ana" y la clave "cortacorta"
    Entonces ella ve el mensaje "La contraseña debe contener al menos una letra mayúscula"

  Escenario: El administrador actualiza el nombre
    Cuando ella cambia el nombre de "eva.estudiante" a "Evelia"
    Entonces ella ve el mensaje "EVELIA Estudiante"

  Escenario: Desactiva a otro usuario
    Cuando ella desactiva a "eva.estudiante"
    Entonces ella ve a "eva.estudiante" como "Inactivo"

  Escenario: El administrador no se desactiva a sí mismo
    Cuando ella desactiva a "ada.admin"
    Entonces ella ve el mensaje "No puedes desactivar tu propia cuenta"

  Escenario: Una búsqueda sin coincidencias deja la tabla vacía
    Cuando ella busca el usuario "zzz"
    Entonces ella ve el mensaje "No hay usuarios que coincidan con los filtros"
