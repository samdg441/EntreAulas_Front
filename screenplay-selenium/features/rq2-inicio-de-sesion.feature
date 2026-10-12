# language: es
@RQ2 @web
Característica: RQ2 - Inicio de sesión
  Como usuario de EntreAulas
  Quiero iniciar sesión con mi correo institucional
  Para llegar al panel que corresponde a mi rol

  Antecedentes:
    Dado que Ana abre EntreAulas sin sesión en "/login"

  @exitoso
  Esquema del escenario: Cada rol llega a su panel
    Cuando ella inicia sesión con la cuenta "<cuenta>"
    Entonces la ruta actual es "<panel>"

    Ejemplos:
      | cuenta      | panel                  |
      | estudiante  | /dashboard-estudiante  |
      | coordinador | /dashboard-coordinador |
      | decano      | /dashboard-decano      |
      | admin       | /dashboard-admin       |

  @alternativo
  Escenario: Clave incorrecta
    Cuando ella inicia sesión como "Estudiante" con "rq2.activo.estudiante@entreaulas.test" y la clave "incorrecta123"
    Entonces ve el mensaje de error "Credenciales inválidas"
    Y la ruta actual es "/login"

  @alternativo
  Escenario: Correo que no existe responde igual que una clave incorrecta
    Cuando ella inicia sesión como "Estudiante" con "no.existe@entreaulas.test" y la clave "password123"
    Entonces ve el mensaje de error "Credenciales inválidas"

  @alternativo
  Escenario: Una cuenta inactiva no puede ingresar
    Cuando ella inicia sesión con la cuenta "inactivo"
    Entonces ve el mensaje de error "Credenciales inválidas"
    Y la ruta actual es "/login"

  @alternativo
  Escenario: El tipo de usuario elegido no coincide con la cuenta
    Cuando ella inicia sesión como "Estudiante" con "rq2.coordinador@entreaulas.test" y la clave "password123"
    Entonces ve el mensaje de error "no coincide con tu cuenta"
    Y la ruta actual es "/login"

  @alternativo
  Escenario: Un correo sin arroba se rechaza antes de llamar al servidor
    Cuando ella inicia sesión como "Estudiante" con "correo-sin-arroba" y la clave "password123"
    Entonces ve el mensaje de error "Por favor, ingresa un correo electrónico válido"
    Y la ruta actual es "/login"
