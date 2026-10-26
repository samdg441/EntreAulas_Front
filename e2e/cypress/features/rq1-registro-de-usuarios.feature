# language: es
@RQ1 @web
Característica: RQ1 - Registro de usuarios desde el administrador
  Como administradora de EntreAulas
  Quiero crear cuentas institucionales con contraseña
  Para que estudiantes y docentes puedan ingresar

  Antecedentes:
    Dado que el back de EntreAulas tiene registradas las cuentas de prueba
    Y que Ana inició sesión con la cuenta "admin"
    Y que ella abre la administración de usuarios

  @exitoso
  Esquema del escenario: La administradora crea un <tipo> con el dominio que le corresponde
    Cuando ella crea un usuario "<tipo>" llamado "<nombre>" con el usuario de correo "<usuario>" y la clave "Clave#2026a"
    Entonces la lista de usuarios muestra "<usuario>@<dominio>"
    Y el back tiene 1 cuenta con el correo "<usuario>@<dominio>"

    Ejemplos:
      | tipo       | nombre      | usuario     | dominio               |
      | estudiante | Luis Pérez  | luis.perez  | soyudemedellin.edu.co |
      | profesor   | Ana Gómez   | ana.gomez   | udemedellin.edu.co    |

  @alternativo
  Escenario: No se registra un correo que ya existe
    Cuando ella crea un usuario "estudiante" llamado "Eva Repetida" con el usuario de correo "eva" y la clave "Clave#2026a"
    Entonces ve el mensaje "El email ya está registrado"
    Y el formulario de alta sigue abierto
    Y el back tiene 1 cuenta con el correo "eva@soyudemedellin.edu.co"

  @error
  Esquema del escenario: Una clave que incumple la política se rechaza antes de llamar al back
    Cuando ella crea un usuario "estudiante" llamado "Leo Díaz" con el usuario de correo "leo.diaz" y la clave "<clave>"
    Entonces ve el mensaje "<motivo>"
    Y el back tiene 0 cuentas con el correo "leo.diaz@soyudemedellin.edu.co"

    Ejemplos:
      | clave         | motivo                       |
      | clave#2026a   | al menos una letra mayúscula |
      | Clave#Segura  | al menos un número           |
      | Clave2026abc  | al menos un carácter especial |
