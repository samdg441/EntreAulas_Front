# language: es
@api
Característica: API real del back
  Como sistema consumidor (el front de EntreAulas)
  Quiero que la API rechace lo que no corresponde y cumpla su contrato
  Para que la interfaz no dependa de su propia validación

  @smoke @RQ19
  Escenario: Sin token no hay datos del coordinador
    Cuando Api consulta "/api/coordinador/dashboard-summary" sin token
    Entonces la respuesta tiene estado 401
    Y el campo "code" de la respuesta es "NO_TOKEN"

  @RQ19
  Escenario: Un correo inexistente recibe el mismo mensaje que una clave incorrecta
    Cuando Api intenta iniciar sesión con "nadie-screenplay@udemedellin.edu.co" y la clave "Clave-Segura2026!"
    Entonces la respuesta tiene estado 401
    Y el campo "error" de la respuesta es "Credenciales inválidas"

  @RQ18
  Escenario: Un QR que no existe se informa como inválido
    Cuando Api consulta "/api/qr-evaluaciones/00000000-0000-4000-8000-000000000000" sin token
    Entonces la respuesta tiene estado 404
    Y el campo "error" de la respuesta es "QR inválido o expirado."

  @con-token @RQ24
  Escenario: El coordinador recibe su resumen paginado
    Cuando Api consulta "/api/coordinador/dashboard-summary?page=1&pageSize=8" como coordinador
    Entonces la respuesta tiene estado 200
    Y la respuesta trae como mucho 8 docentes

  @con-token @RQ19
  Escenario: El coordinador no abre endpoints de administrador
    Cuando Api consulta "/api/users" como coordinador
    Entonces la respuesta tiene estado 403
    Y el campo "code" de la respuesta es "FORBIDDEN_ROLE"

  @con-token @RQ22
  Escenario: Un docente de otra carrera no se expone
    Cuando Api consulta "/api/coordinador/profesor-stats/999999?period=2026-1" como coordinador
    Entonces la respuesta tiene estado 404
