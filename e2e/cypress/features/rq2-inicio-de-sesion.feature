# language: es
@RQ2 @web
Característica: RQ2 - Inicio de sesión
  Como usuario de EntreAulas
  Quiero iniciar sesión con mi correo institucional
  Para llegar al panel que corresponde a mi rol

  Antecedentes:
    Dado que el back de EntreAulas tiene registradas las cuentas de prueba

  @exitoso
  Esquema del escenario: Cada rol llega a su panel
    Cuando Ana inicia sesión con la cuenta "<cuenta>"
    Entonces la ruta actual es "<panel>"
    Y su sesión queda guardada con un token

    Ejemplos:
      | cuenta      | panel                  |
      | estudiante  | /dashboard-estudiante  |
      | profesor    | /dashboard-profesor    |
      | coordinador | /dashboard-coordinador |
      | admin       | /dashboard-admin       |

  @alternativo
  Escenario: El tipo de usuario elegido no coincide con la cuenta
    Cuando Ana inicia sesión como "profesor" con "eva@soyudemedellin.edu.co" y la clave "Clave#2026a"
    Entonces ve el mensaje "no coincide con tu cuenta"
    Y la ruta actual es "/login"

  @error
  Esquema del escenario: Credenciales que no permiten entrar responden igual
    Cuando Ana inicia sesión como "estudiante" con "<correo>" y la clave "<clave>"
    Entonces ve el mensaje "Credenciales inválidas"
    Y la ruta actual es "/login"
    Y no tiene sesión guardada

    Ejemplos:
      | caso               | correo                           | clave         |
      | clave incorrecta   | eva@soyudemedellin.edu.co        | Incorrecta#1  |
      | correo inexistente | nadie@soyudemedellin.edu.co      | Clave#2026a   |
      | cuenta inactiva    | inactivo@soyudemedellin.edu.co   | Clave#2026a   |

  @error
  Escenario: Un correo sin arroba se rechaza antes de llamar al servidor
    Cuando Ana inicia sesión como "estudiante" con "correo-sin-arroba" y la clave "Clave#2026a"
    Entonces ve el mensaje "Por favor, ingresa un correo electrónico válido"
    Y no se llamó al login del back
