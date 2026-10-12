# language: es
@web
Característica: Acceso, QR y materias del estudiante
  Como estudiante o administrador de la Universidad de Medellín
  Quiero entrar solo a lo que me corresponde y usar el QR de evaluación
  Para inscribirme, generar códigos y ver mis materias

  @RQ6
  Escenario: Sin sesión, usuarios del sistema vuelve al login
    Dado que Eva abre EntreAulas en "/admin/users"
    Entonces ella está en la ruta "/login"

  @RQ6
  Escenario: El estudiante entra a su dashboard
    Dado que Eva abre EntreAulas en "/login"
    Cuando ella inicia sesión como "Estudiante" con "eva.estudiante@soyudemedellin.edu.co" y la clave válida
    Entonces ella está en la ruta "/dashboard-estudiante"

  @RQ6
  Escenario: El estudiante no administra usuarios
    Dado que Eva abre EntreAulas en "/login"
    Cuando ella inicia sesión como "Estudiante" con "eva.estudiante@soyudemedellin.edu.co" y la clave válida
    Y ella abre directamente "/admin/users"
    Entonces ella está en la ruta "/forbidden"
    Y ella ve el mensaje "Acceso no permitido"

  @RQ17
  Escenario: Un QR sin token no abre la evaluación
    Dado que Eva abre EntreAulas en "/qr-evaluacion"
    Entonces ella ve el mensaje "No se encontró token en el QR."

  @RQ17
  Escenario: Con token y sin sesión vuelve al login
    Dado que Eva abre EntreAulas en "/qr-evaluacion?token=tok-14"
    Entonces ella está en la ruta "/login"

  @RQ14
  Escenario: El estudiante se inscribe con un QR válido
    Dado que Eva abre EntreAulas en "/login"
    Cuando ella inicia sesión como "Estudiante" con "eva.estudiante@soyudemedellin.edu.co" y la clave válida
    Y ella abre directamente "/qr-evaluacion?token=tok-14"
    Entonces ella está en la ruta "/evaluate/form"

  @RQ14
  Escenario: Un QR que no inscribe no abre la encuesta
    Dado que Eva abre EntreAulas en "/login"
    Cuando ella inicia sesión como "Estudiante" con "eva.estudiante@soyudemedellin.edu.co" y la clave válida
    Y ella abre directamente "/qr-evaluacion?token=tok-malo"
    Entonces ella ve el mensaje "No se pudo abrir la encuesta"
    Y ella ve el mensaje "QR inválido o expirado."
    Y ella está en la ruta "/qr-evaluacion"

  @RQ15
  Escenario: El administrador abre la generación de QR
    Dado que Ada abre EntreAulas en "/login"
    Cuando ella inicia sesión como "Administrador" con "ada.admin@udemedellin.edu.co" y la clave válida
    Y ella abre directamente "/admin/qr"
    Entonces ella ve el mensaje "Generación de QR"

  @RQ15
  Escenario: Sin fechas ni grupos no genera el QR
    Dado que Ada abre EntreAulas en "/login"
    Cuando ella inicia sesión como "Administrador" con "ada.admin@udemedellin.edu.co" y la clave válida
    Y ella abre directamente "/admin/qr"
    Y ella confirma la generación de QR
    Entonces ella ve el mensaje "Completa Fecha de inicio, Fecha de cierre y Período."

  @RQ16
  Escenario: Sin grupos no se puede compartir el QR por correo
    Dado que Ada abre EntreAulas en "/login"
    Cuando ella inicia sesión como "Administrador" con "ada.admin@udemedellin.edu.co" y la clave válida
    Y ella abre directamente "/admin/qr"
    Entonces ella ve el mensaje "Generación de QR"
    Y ella no ve el mensaje "Compartir QRs por correo"

  @RQ27
  Escenario: El estudiante ve la relación con su materia
    Dado que Eva abre EntreAulas en "/login"
    Cuando ella inicia sesión como "Estudiante" con "eva.estudiante@soyudemedellin.edu.co" y la clave válida
    Entonces ella ve el mensaje "Relación estudiante–materia del periodo actual"
    Y ella ve el mensaje "SIS-101 · Programación I"

  @RQ27
  Escenario: Sin materias matriculadas la lista queda vacía
    Dado que Lía abre EntreAulas en "/login"
    Cuando ella inicia sesión como "Estudiante" con "lia.estudiante@soyudemedellin.edu.co" y la clave válida
    Entonces ella ve el mensaje "No tienes materias matriculadas este semestre."

  @RQ27
  Escenario: Sin sesión no muestra las materias
    Dado que Eva abre EntreAulas en "/dashboard-estudiante"
    Entonces ella está en la ruta "/login"
