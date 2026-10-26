# language: es
@RQ4
Característica: RQ4 - Envío del enlace de recuperación por correo
  Como sistema
  Quiero enviar un enlace de un solo uso solo a cuentas reales
  Para que nadie pueda saber qué correos existen ni reutilizar enlaces

  @web @exitoso
  Escenario: Una solicitud de un correo registrado envía exactamente un correo con el enlace
    Dado que el back de EntreAulas tiene registradas las cuentas de prueba
    Y que Ana abre EntreAulas sin sesión en "/forgot-password"
    Cuando ella solicita la recuperación de "eva@soyudemedellin.edu.co"
    Entonces "eva@soyudemedellin.edu.co" recibió 1 correo de recuperación

  @web @alternativo
  Escenario: Un correo no registrado no recibe nada
    Dado que el back de EntreAulas tiene registradas las cuentas de prueba
    Y que Ana abre EntreAulas sin sesión en "/forgot-password"
    Cuando ella solicita la recuperación de "nadie@soyudemedellin.edu.co"
    Entonces "nadie@soyudemedellin.edu.co" recibió 0 correos de recuperación

  @api @alternativo
  Escenario: La API real responde igual a un correo no registrado y no expone el token
    Cuando Ana pide por API el enlace de recuperación de "nadie.bdd@udemedellin.edu.co"
    Entonces la respuesta tiene estado 200
    Y la respuesta no incluye ningún enlace ni token de recuperación

  @api @error
  Escenario: La API real rechaza un correo con formato inválido
    Cuando Ana pide por API el enlace de recuperación de "correo-invalido"
    Entonces la respuesta tiene estado 400
