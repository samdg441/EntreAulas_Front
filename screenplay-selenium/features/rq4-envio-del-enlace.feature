# language: es
@RQ4 @api
Característica: RQ4 - Generación y envío del enlace de recuperación
  Como sistema
  Quiero generar un enlace seguro de un solo uso por solicitud
  Para enviarlo por correo únicamente a cuentas reales

  @exitoso
  Escenario: Una solicitud válida genera un enlace de restablecimiento de un solo uso
    Cuando Ana pide por API el enlace de recuperación de "usuario.activo@entreaulas.test"
    Entonces la respuesta tiene estado 200
    Y el enlace generado apunta a "/reset-password" con un token de 64 caracteres y el correo solicitado

  @alternativo
  Escenario: Dos solicitudes seguidas generan enlaces distintos
    Cuando Ana pide por API el enlace de recuperación de "usuario.activo@entreaulas.test"
    Y ella guarda el token recibido
    Y ella pide por API el enlace de recuperación de "usuario.activo@entreaulas.test"
    Entonces el token recibido es distinto del guardado

  @alternativo
  Escenario: Un correo no registrado no genera enlace
    Cuando Ana pide por API el enlace de recuperación de "nadie.registrado@entreaulas.test"
    Entonces la respuesta tiene estado 200
    Y la respuesta no incluye ningún enlace de recuperación

  @alternativo
  Escenario: Un correo con formato inválido se rechaza
    Cuando Ana pide por API el enlace de recuperación de "correo-invalido"
    Entonces la respuesta tiene estado 400
