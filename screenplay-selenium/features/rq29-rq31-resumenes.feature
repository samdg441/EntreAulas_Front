# language: es
Característica: RQ29, RQ30 y RQ31 - Resúmenes de respuestas abiertas y alerta de acoso
  Como docente, coordinador o decano
  Quiero un resumen de los comentarios de las evaluaciones
  Para leer lo que dijeron los estudiantes y enterarme si hubo una mención de acoso

  @web @RQ29 @exitoso
  Escenario: El docente ve el botón para generar el resumen de sus cursos
    Dado que Ana abre EntreAulas sin sesión en "/login"
    Y que ella registra por API un docente con la clave "Clave#2026"
    Y que ella inicia sesión como "Docente" con el correo creado y la clave "Clave#2026"
    Y que ella abre EntreAulas en "/reports"
    Entonces ve el texto "Generar resumen IA"
    Y ve el texto "Resumen IA"

  @web @RQ30 @exitoso
  Escenario: El coordinador ve el resumen de su carrera
    Dado que Ana abre EntreAulas sin sesión en "/login"
    Y que ella ingresó con la cuenta "coordinador"
    Y que ella abre EntreAulas en "/reports"
    Entonces ve el texto "Generar resumen IA"
    Y ve el texto "Resumen IA (Mi Carrera)"

  @web @RQ30 @exitoso
  Escenario: El decano ve el resumen de la facultad
    Dado que Ana abre EntreAulas sin sesión en "/login"
    Y que ella ingresó con la cuenta "decano"
    Y que ella abre EntreAulas en "/reports"
    Entonces ve el texto "Generar resumen IA"
    Y ve el texto "Resumen IA (Facultad de Ingeniería)"

  @api @RQ29 @alternativo
  Escenario: Sin token no hay resumen
    Cuando Ana pide un resumen sin token
    Entonces la respuesta tiene estado 401
    Y el campo "code" de la respuesta es "NO_TOKEN"

  @api @RQ29 @alternativo
  Escenario: Sin comentarios el resumen se rechaza
    Cuando Ana inicia sesión por API con la cuenta "coordinador"
    Y ella pide un resumen sin comentarios
    Entonces la respuesta tiene estado 400
    Y el campo "error" de la respuesta menciona "texts"

  @api @RQ29 @exitoso
  Escenario: Un comentario sin acoso no enciende la alerta
    Cuando Ana inicia sesión por API con la cuenta "coordinador"
    Y ella pide un resumen del comentario "La explicación fue clara"
    Entonces la respuesta tiene estado 200
    Y el campo "acosoDetectado" de la respuesta es falso
    Y el campo "summary" de la respuesta tiene texto

  @api @RQ30 @alternativo
  Escenario: Sin token no hay resumen de la carrera
    Cuando Ana consulta "/api/ai/summarize/by-career" sin token
    Entonces la respuesta tiene estado 401
    Y el campo "code" de la respuesta es "NO_TOKEN"

  @api @RQ30 @alternativo
  Escenario: Sin token no hay resumen de la facultad
    Cuando Ana consulta "/api/ai/summarize/by-faculty" sin token
    Entonces la respuesta tiene estado 401
    Y el campo "code" de la respuesta es "NO_TOKEN"

  @api @RQ30 @alternativo
  Escenario: Un coordinador no pide el resumen de la facultad
    Cuando Ana inicia sesión por API con la cuenta "coordinador"
    Y ella consulta "/api/ai/summarize/by-faculty" con su sesión
    Entonces la respuesta tiene estado 403
    Y el campo "code" de la respuesta es "FORBIDDEN_ROLE"

  @api @RQ31 @exitoso
  Escenario: La alerta de acoso viaja en el mismo cuerpo del resumen
    Cuando Ana inicia sesión por API con la cuenta "coordinador"
    Y ella pide un resumen del comentario "Hubo acoso en la clase y faltó claridad"
    Entonces la respuesta tiene estado 200
    Y el campo "acosoDetectado" de la respuesta es verdadero
    Y el campo "mensajeAcoso" de la respuesta menciona "acoso"
