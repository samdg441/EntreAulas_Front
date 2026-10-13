# language: es
@RQ13 @api
Característica: RQ13 - Contrato de gestión de usuarios
  Como sistema
  Quiero que solo un administrador cree, actualice y desactive usuarios
  Para que la contraseña no viaje en la respuesta y nadie cierre su propia cuenta

  @alternativo
  Escenario: Sin token no se crea un usuario
    Cuando Ana intenta crear por API un estudiante sin token con la clave "Clave#2026"
    Entonces la respuesta tiene estado 401
    Y el campo "code" de la respuesta es "NO_TOKEN"

  @alternativo
  Escenario: Un coordinador no crea usuarios
    Cuando Ana inicia sesión por API con la cuenta "coordinador"
    Y ella intenta crear por API un estudiante con la clave "Clave#2026"
    Entonces la respuesta tiene estado 403
    Y el campo "code" de la respuesta es "FORBIDDEN_ROLE"

  @exitoso
  Escenario: El administrador crea un estudiante y la respuesta no lleva la contraseña
    Cuando Ana inicia sesión por API con la cuenta "admin"
    Y ella crea por API un estudiante con la clave "Clave#2026"
    Entonces la respuesta tiene estado 201
    Y el campo "user.tipo_usuario" de la respuesta es "estudiante"
    Y la respuesta no menciona "Clave#2026"

  @alternativo
  Escenario: Un correo ya registrado no crea otro usuario
    Cuando Ana inicia sesión por API con la cuenta "admin"
    Y ella crea por API un estudiante con la clave "Clave#2026"
    Y ella vuelve a crear por API ese estudiante con la clave "Clave#2026"
    Entonces la respuesta tiene estado 400
    Y el campo "error" de la respuesta es "El email ya está registrado"

  @exitoso
  Escenario: El administrador actualiza el nombre por API
    Cuando Ana inicia sesión por API con la cuenta "admin"
    Y ella crea por API un estudiante con la clave "Clave#2026"
    Y ella actualiza por API el nombre del usuario creado a "Evelia"
    Entonces la respuesta tiene estado 200
    Y el campo "user.nombre" de la respuesta es "EVELIA"

  @exitoso
  Escenario: El administrador desactiva a otro usuario por API
    Cuando Ana inicia sesión por API con la cuenta "admin"
    Y ella crea por API un estudiante con la clave "Clave#2026"
    Y ella desactiva por API el usuario creado
    Entonces la respuesta tiene estado 200
    Y el campo "user.activo" de la respuesta es falso

  @alternativo
  Escenario: El administrador no se desactiva a sí mismo por API
    Cuando Ana inicia sesión por API con la cuenta "admin"
    Y ella intenta desactivar por API su propia cuenta
    Entonces la respuesta tiene estado 400
    Y el campo "error" de la respuesta es "No puedes desactivar tu propia cuenta"
