# language: es
@web @RQ19
Característica: Inicio de sesión y acceso según el rol
  Como coordinador de la Universidad de Medellín
  Quiero ingresar con mi cuenta institucional
  Para llegar directamente al panel que me corresponde

  @smoke
  Escenario: El coordinador ingresa y llega a su panel
    Dado que Carlos abre EntreAulas en "/login"
    Cuando él inicia sesión como "Coordinador" con "carlos.coordinador@udemedellin.edu.co" y la clave válida
    Entonces él está en la ruta "/dashboard-coordinador"

  Escenario: Credenciales inválidas
    Dado que Carlos abre EntreAulas en "/login"
    Cuando él inicia sesión como "Coordinador" con "carlos.coordinador@udemedellin.edu.co" y la clave "Clave-Incorrecta2026!"
    Entonces él ve en el login el mensaje "Credenciales inválidas"
    Y él está en la ruta "/login"

  Escenario: El tipo de usuario elegido no coincide con la cuenta
    Dado que Eva abre EntreAulas en "/login"
    Cuando ella inicia sesión como "Coordinador" con "eva.estudiante@soyudemedellin.edu.co" y la clave válida
    Entonces ella ve en el login el mensaje "no coincide con tu cuenta"
    Y ella está en la ruta "/login"

  Escenario: Un correo mal escrito se corrige antes de llegar al back
    Dado que Carlos abre EntreAulas en "/login"
    Cuando él escribe el correo "carlos-sin-arroba"
    Entonces él ve en el login el mensaje "Por favor, ingresa un correo electrónico válido"
    Y el back no recibió intentos de inicio de sesión

  Escenario: Sin sesión, una página protegida lleva al login
    Dado que Eva abre EntreAulas en "/reports"
    Entonces ella está en la ruta "/login"

  Escenario: La sesión sobrevive al abrir una página directamente (regresión)
    Dado que Carlos ingresó como coordinador
    Cuando él abre directamente "/reports"
    Entonces él está en la ruta "/reports"
