# language: es
@RQ3 @web
Característica: RQ3 - Solicitud de recuperación (RQ3.1) y validación del token (RQ3.2)
  Como usuario que olvidó su contraseña
  Quiero pedir un enlace de recuperación
  Para volver a ingresar sin revelar qué correos existen

  Antecedentes:
    Dado que el back de EntreAulas tiene registradas las cuentas de prueba
    Y que Ana abre EntreAulas sin sesión en "/forgot-password"

  @RQ3-1 @exitoso
  Escenario: Un correo registrado recibe la confirmación genérica
    Cuando ella solicita la recuperación de "eva@soyudemedellin.edu.co"
    Entonces ve el mensaje "Solicitud enviada"
    Y ve el mensaje "Si el correo electrónico existe en nuestro sistema"

  @RQ3-1 @alternativo
  Escenario: Un correo no registrado recibe exactamente la misma confirmación
    Cuando ella solicita la recuperación de "nadie@soyudemedellin.edu.co"
    Entonces ve el mensaje "Solicitud enviada"
    Y ve el mensaje "Si el correo electrónico existe en nuestro sistema"

  @RQ3-1 @error
  Escenario: Un correo con formato inválido no se envía
    Cuando ella solicita la recuperación de "usuario@dominio"
    Entonces ve el mensaje "Por favor, ingresa un correo electrónico válido"
    Y no ve el mensaje "Solicitud enviada"

  @RQ3-2 @exitoso
  Escenario: Un enlace vigente muestra el formulario de nueva contraseña
    Dado que "eva@soyudemedellin.edu.co" recibió un enlace de recuperación vigente
    Cuando ella abre el enlace de recuperación de "eva@soyudemedellin.edu.co"
    Entonces ve el mensaje "Crear nueva contraseña"

  @RQ3-2 @error
  Escenario: Un enlace vencido se rechaza
    Dado que "eva@soyudemedellin.edu.co" recibió un enlace de recuperación vencido
    Cuando ella abre el enlace de recuperación de "eva@soyudemedellin.edu.co"
    Entonces ve el mensaje "El token ha expirado"
    Y ve el mensaje "Solicitar un nuevo enlace"

  @RQ3-2 @error
  Escenario: Un enlace incompleto se rechaza sin consultar al back
    Cuando ella abre EntreAulas en "/reset-password?token=abc"
    Entonces ve el mensaje "inválido o está incompleto"
