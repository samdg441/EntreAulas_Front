# language: es
@RQ5 @web
Característica: RQ5 - Restablecer la contraseña
  Como usuario con un enlace de recuperación vigente
  Quiero definir una nueva contraseña
  Para recuperar el acceso a mi cuenta

  Antecedentes:
    Dado que el back de EntreAulas tiene registradas las cuentas de prueba
    Y que "eva@soyudemedellin.edu.co" recibió un enlace de recuperación vigente
    Y que Ana abre el enlace de recuperación de "eva@soyudemedellin.edu.co"

  @exitoso
  Escenario: Cambia la contraseña, la nueva funciona y la anterior no
    Cuando ella restablece su contraseña con "ClaveNueva#2027" y la confirma
    Entonces ve el mensaje "Contraseña actualizada"
    Y "eva@soyudemedellin.edu.co" puede iniciar sesión como "estudiante" con la clave "ClaveNueva#2027"
    Y "eva@soyudemedellin.edu.co" no puede iniciar sesión como "estudiante" con la clave "Clave#2026a"

  @alternativo
  Escenario: Un enlace ya usado no sirve una segunda vez
    Cuando ella restablece su contraseña con "ClaveNueva#2027" y la confirma
    Y ella abre de nuevo el enlace de recuperación de "eva@soyudemedellin.edu.co"
    Entonces ve el mensaje "Token inválido o ya utilizado"
    Y ve el mensaje "Solicitar un nuevo enlace"

  @error
  Escenario: Las contraseñas no coinciden
    Cuando ella restablece su contraseña con "ClaveNueva#2027" y la confirma como "OtraClave#2027"
    Entonces ve el mensaje "Las contraseñas no coinciden"

  @error
  Esquema del escenario: La contraseña nueva incumple la política (<regla>)
    Cuando ella restablece su contraseña con "<clave>" y la confirma
    Entonces ve el mensaje "<motivo>"

    Ejemplos:
      | regla      | clave        | motivo                        |
      | longitud   | Ab#1         | al menos 8 caracteres         |
      | mayúscula  | claveminus#1 | al menos una letra mayúscula  |
      | minúscula  | CLAVEMAYUS#1 | al menos una letra minúscula  |
      | número     | ClaveSinNum# | al menos un número            |
      | especial   | ClaveSinEsp1 | al menos un carácter especial |
