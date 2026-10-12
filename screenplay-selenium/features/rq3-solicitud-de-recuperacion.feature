# language: es
@RQ3 @web
Característica: RQ3 - Solicitud de recuperación de contraseña
  Como usuario que olvidó su contraseña
  Quiero pedir un enlace de recuperación
  Para volver a ingresar sin revelar qué correos existen

  Antecedentes:
    Dado que Ana abre EntreAulas sin sesión en "/forgot-password"

  @exitoso
  Escenario: Correo registrado recibe la confirmación genérica
    Cuando ella solicita la recuperación de "usuario.activo@entreaulas.test"
    Entonces ve la confirmación "Solicitud enviada"
    Y el aviso dice "Si el correo electrónico existe en nuestro sistema"

  @alternativo
  Escenario: Correo no registrado recibe exactamente la misma confirmación
    Cuando ella solicita la recuperación de "nadie.registrado@entreaulas.test"
    Entonces ve la confirmación "Solicitud enviada"
    Y el aviso dice "Si el correo electrónico existe en nuestro sistema"

  @alternativo
  Escenario: Correo con formato inválido
    Cuando ella solicita la recuperación de "usuario@dominio"
    Entonces ve el mensaje de error "Por favor, ingresa un correo electrónico válido"
    Y no ve ninguna confirmación

  @RQ3-2 @alternativo
  Escenario: Un enlace con token inexistente se rechaza
    Cuando ella abre un enlace de restablecimiento con un token inexistente
    Entonces ve el mensaje de error "Token inválido"
    Y ve la opción de solicitar un nuevo enlace

  @RQ3-2 @alternativo
  Escenario: Un enlace con token expirado se rechaza
    Cuando ella abre un enlace de restablecimiento con el token expirado
    Entonces ve el mensaje de error "expirado"

  @RQ3-2 @alternativo
  Escenario: Un enlace incompleto se rechaza
    Cuando ella abre directamente "/reset-password"
    Entonces ve el mensaje de error "inválido o está incompleto"
