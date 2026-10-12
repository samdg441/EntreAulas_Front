# Métricas y criterios de aceptación — Seguridad y rendimiento (RQ1, RQ2, RQ3, RQ3.1, RQ3.4, RQ5)

Fecha de ejecución: 2026-10-11 · Node 22 (back) / Node 26 (front) · Equipo local Linux · Base de datos: Supabase real en las pruebas de carga y simulada en las pruebas unitarias.

Este documento define **qué se mide, con qué umbral se acepta y qué resultado se obtuvo** en las pruebas de seguridad y de rendimiento de los requisitos de autenticación. Los criterios son propuestos por el equipo de pruebas (no vienen de un SLA firmado) y se justifican en cada tabla. Las cifras salen de ejecuciones reales; lo que no se pudo medir se declara en la sección 7.

## 1. Alcance

| RQ | Funcionalidad | Back | Front |
|---|---|---|---|
| RQ1 | Registro de usuarios desde el administrador (`POST /api/auth/create-user`) | sí | sí (`AdminUsersPage`, `validation.ts`) |
| RQ2 | Login (`POST /api/auth/login`, `/login-with-role`, `GET /api/auth/me`) | sí | sí (`Login.tsx`, `AuthContext`, interceptor de axios) |
| RQ3 | Recuperación de contraseña (pantallas) | — | sí (`ForgotPassword.tsx`, `ResetPassword.tsx`) |
| RQ3.1 | Solicitud de recuperación (`POST /api/auth/forgot-password`) | sí | — |
| RQ3.4 | Validación del token de recuperación (`GET /api/auth/validate-reset-token/:token`) | sí | — |
| RQ5 | Restablecer contraseña (`POST /api/auth/reset-password`) | sí | sí |

**Supuesto:** RQ3.4 no existe con ese número en el repositorio; se interpretó como la validación del token (en el código y en el Sonar del front figura como RQ3.2). Si es otro requisito, solo cambia la sección 4.3.

## 2. Qué se implementó

| Capa | Archivo | Pruebas |
|---|---|---|
| Back · seguridad | `src/test/security/rq1-create-user.security.test.ts` | 19 |
| Back · seguridad | `src/test/security/rq2-login-avanzado.security.test.ts` | 14 |
| Back · seguridad | `src/test/security/rq3-recuperacion.security.test.ts` (RQ3.1, RQ3.4 y RQ5) | 41 |
| Back · seguridad | `src/test/security/rq1-rq5-cabeceras.security.test.ts` | 17 |
| Back · defectos | `src/test/defects/DEF-39` … `DEF-45` (fallan a propósito mientras el defecto siga abierto) | 14 |
| Back · rendimiento | `src/test/performance/rq1-rq5-rendimiento.performance.test.ts` | 12 |
| Back · carga | `carga/carga-api.mjs` + `carga/escenarios.mjs` (perfiles `smoke`, `carga`, `estres`, `pico`, `soak`) | 6 escenarios RQ1–RQ5 |
| Front · seguridad | `src/test/security/rq2-login-sesion`, `rq1-admin-usuarios`, `rq3-rq5-recuperacion` | 10 + 20 + 21 |
| Front · defectos | `src/test/defects/DEF-FE-04` y `DEF-FE-05` | 17 |
| Front · rendimiento | `src/test/performance/rq1-rq5-rendimiento.performance.test.tsx` | 8 |
| Front · dependencias | `scripts/auditoria-dependencias.mjs` (`npm run test:audit`) | — |
| Front · bundle | `scripts/analizar-bundle.mjs` (`npm run perf:bundle`) | — |
| Front · carga | `carga/carga-front.mjs` (`npm run perf:carga`) | 5 escenarios |
| Front · navegador real | `perf/lighthouse.mjs` (`npm run perf:lighthouse`) | 3 pantallas × 2 perfiles |

Estado de las suites existentes tras los cambios: back `npm test` 68 archivos / 814 pruebas en verde; front 41 archivos / 420 pruebas en verde.

## 3. Métricas definidas

### 3.1 Rendimiento

| Métrica | Definición | Cómo se mide |
|---|---|---|
| Tiempo de respuesta p50 / p95 / p99 | Percentil de la latencia de las peticiones exitosas y fallidas. **p95** es la métrica de aceptación: el 95 % de los usuarios la ve como máximo | `carga/carga-api.mjs`, `medicion.ts` |
| Tasa de error | `(respuestas inesperadas + timeouts + fallos de red) / peticiones`. Un 401 o 400 *esperado* no cuenta | `carga-api.mjs` |
| Throughput (rps) | Peticiones completadas por segundo | `carga-api.mjs` |
| Capacidad de bcrypt | Hashes por segundo = hilos de libuv (4) / tiempo de un hash (~0,32 s) ≈ **12 logins/s** | prueba de rendimiento del back |
| Memoria del proceso (RSS) | Memoria residente del back muestreada cada 5 s (`PID_BACK`); se juzga la tendencia después de 30 s de calentamiento | `carga-api.mjs` |
| Peso inicial del bundle | KB de JS+CSS que referencia `index.html` (se descarga antes de pintar el login), bruto y gzip | `analizar-bundle.mjs` |
| Core Web Vitals | LCP, FCP, TBT, CLS y puntaje de Performance de Lighthouse 12 (perfil escritorio y móvil con 4× CPU y 4G lenta) | `perf/lighthouse.mjs` |
| Render en jsdom | Mediana de montar una pantalla / listar usuarios | `medicion.ts` |

### 3.2 Seguridad

| Métrica | Definición |
|---|---|
| Controles verificados | Pruebas de seguridad que pasan (el control existe y funciona) |
| Defectos abiertos por severidad | Críticos / altos / medios / bajos, cada uno con una prueba ejecutable que falla |
| Vulnerabilidades de dependencias | Altas y críticas de `npm audit` en producción |
| Cabeceras de seguridad presentes | CSP, X-Frame-Options, nosniff, Referrer-Policy, HSTS, compresión |

Escala de severidad: **Crítica** (toma de control o escalada de privilegios sin autenticación) · **Alta** (permite ataque automatizable: fuerza bruta, abuso masivo) · **Media** (filtra información o debilita un control) · **Baja** (endurecimiento).

## 4. Criterios de aceptación y resultados

Semáforo: 🟢 cumple · 🟡 cumple con reserva / riesgo aceptado · 🔴 no cumple.

### 4.1 Seguridad — Back

Criterio general: **0 defectos críticos o altos abiertos** y todos los controles listados verificados.

| RQ | Control (criterio) | Resultado | Evidencia |
|---|---|---|---|
| RQ1 | Sin token → 401; estudiante, profesor y coordinador → 403 | 🟢 | `rq1-create-user` |
| RQ1 | Poner `admin` dentro del JWT no escala privilegios (el rol sale de la BD); admin desactivado → 401 | 🟢 | `rq1-create-user` |
| RQ1 | La respuesta no devuelve contraseña ni hash; se guarda bcrypt | 🟢 | `rq1-create-user` |
| RQ1 | Mass-assignment (`id`, `activo`, `roles`) ignorado | 🟢 | `rq1-create-user` |
| RQ1 | Correos con CRLF, SQL, script, dominio ajeno u objeto → 400 | 🟢 | `rq1-create-user` |
| RQ1 | **Solo el admin puede crear cuentas privilegiadas** | 🔴 **Crítica** — `POST /register` público crea `admin` y entrega JWT | DEF-39 |
| RQ1 | `tipo_usuario` fuera de la lista se rechaza | 🔴 Alta — se acepta | DEF-21 (existente) |
| RQ1 | Misma política de contraseña que en la recuperación | 🔴 Baja — `12345678` se acepta | DEF-45 |
| RQ1/RQ2 | Un 500 no expone el mensaje de la BD | 🔴 Media | DEF-40 (origen DEF-31) |
| RQ2 | Misma respuesta (cuerpo) para correo inexistente, clave mala y cuenta inactiva | 🟢 | `rq19-login` |
| RQ2 | **Mismo tiempo de respuesta** (sin enumeración por tiempos) | 🔴 Media — 4 ms frente a 340 ms | DEF-41 |
| RQ2 | Límite de intentos (429) | 🔴 **Alta** | DEF-34 (existente) |
| RQ2 | JWT HS256, vence en ≤ 24 h, sin datos sensibles; `alg:none`, otra clave y vencido → 401 sin 500 ni stack | 🟢 | `rq2-login-avanzado` |
| RQ2 | `login-with-role` con un rol que la cuenta no tiene → 401 igual que clave mala | 🟢 | `rq2-login-avanzado` |
| RQ3.1 | Misma respuesta para correo existente e inexistente | 🟢 | `rq3-recuperacion` |
| RQ3.1 | El token no viaja en el JSON (ni con el modo debug en producción); 256 bits, único, vence en ≤ 1 h | 🟢 | `rq3-recuperacion` |
| RQ3.1 | Entradas con CRLF, varios destinatarios, objetos o 100 000 caracteres → 4xx, nunca 500 | 🟢 | `rq3-recuperacion` |
| RQ3.1 | Límite de solicitudes (anti-spam de correo) | 🔴 **Alta** | DEF-43 |
| RQ3.1 | Un solo token vigente por usuario | 🔴 Baja | DEF-44 |
| RQ3.4 | Token ligado al correo; inexistente, expirado o usado → 400 genérico; tokens hostiles → 400; validar no consume el token | 🟢 | `rq3-recuperacion` |
| RQ3.4 | Límite de intentos al adivinar tokens | 🔴 **Alta** (el espacio de 256 bits hace inviable adivinar, pero no hay freno) | DEF-43 |
| RQ5 | Guarda bcrypt, marca el token usado; segundo uso → 400; expirado → 400; token de otro correo no sirve | 🟢 | `rq3-recuperacion` |
| RQ5 | Política (8 caracteres, mayúscula, minúscula, número, especial) y confirmación; tipos extraños no dan 500 | 🟢 | `rq3-recuperacion` |
| RQ5 | Las sesiones previas se invalidan al cambiar la clave | 🔴 Media — el JWT anterior sigue válido | DEF-42 |
| Transversal | No se anuncia Express; 413 con body > 100 KB; 400 con JSON roto; verbos PUT/PATCH/DELETE no ejecutan nada | 🟢 | `rq1-rq5-cabeceras` |
| Transversal | Preflight CORS de un origen no autorizado no recibe `Access-Control-Allow-Origin` | 🟡 con `CORS_ORIGIN` definido; por lectura del código, si la variable queda vacía cae a `*` con `credentials: true` (no se probó ese caso) | `rq1-rq5-cabeceras` |
| Transversal | Cabeceras de seguridad (helmet) | 🔴 Baja | DEF-35 (existente) |
| Transversal | Errores de cuerpo en JSON, no en HTML | 🔴 Baja | DEF-38 (existente) |

**Resumen back:** 91 pruebas nuevas de seguridad en verde. Defectos nuevos abiertos: 1 crítico (DEF-39), 1 alto (DEF-43), 3 medios (DEF-40, DEF-41, DEF-42) y 2 bajos (DEF-44, DEF-45). Defectos ya registrados que también afectan estos RQ: DEF-34 y DEF-21 (altos), DEF-31 (medio), DEF-35 y DEF-38 (bajos). **El criterio general NO se cumple.**

### 4.2 Seguridad — Front

| RQ | Control (criterio) | Resultado | Evidencia |
|---|---|---|---|
| RQ2 | El campo de contraseña oculta lo escrito | 🟢 | `rq2-login-sesion` |
| RQ2 | Mensajes de error con HTML se muestran como texto (sin XSS) | 🟢 | `rq2-login-sesion`, `rq1-admin-usuarios`, `rq3-rq5-recuperacion` |
| RQ2 | Un login fallido no deja token; la contraseña no va a consola ni almacenamiento | 🟢 | `rq2-login-sesion` |
| RQ2 | 401 limpia la sesión; 403 no la borra; el token solo viaja en `Authorization` | 🟢 | `rq2-login-sesion` |
| RQ2 | JWT en `localStorage` | 🟡 Riesgo conocido: cualquier XSS lo lee. Hoy mitigado porque React escapa todo y no hay `dangerouslySetInnerHTML`, pero sin CSP no hay segunda barrera (ver DEF-FE-05) | `rq2-login-sesion` |
| RQ2 | `redirectTo` solo a rutas internas | 🔴 Baja — hoy React Router lo interpreta como ruta relativa (pantalla rota), la protección es accidental | DEF-FE-04 |
| RQ1 | Pantalla de alta solo para admin (estudiante, profesor, coordinador, decano, sin rol → `/forbidden`) | 🟢 | `rq1-admin-usuarios` |
| RQ1 | El dominio del correo siempre es el institucional y no se inyectan CRLF; contraseñas débiles no llegan a la API | 🟢 | `rq1-admin-usuarios` |
| RQ1 | Nombres con HTML que llegan de la API se pintan como texto (sin XSS almacenado) | 🟢 | `rq1-admin-usuarios` |
| RQ3/RQ5 | Mensaje genérico del servidor; correo inválido o con CRLF bloqueado en el cliente | 🟢 | `rq3-rq5-recuperacion` |
| RQ5 | Token/correo de la URL con HTML no se interpretan; enlace inválido no muestra el formulario; el token no se copia al almacenamiento; política igual a la del back | 🟢 | `rq3-rq5-recuperacion` |
| Despliegue | CSP, X-Frame-Options, nosniff, Referrer-Policy, HSTS en nginx, Vercel e `index.html`; gzip; `server_tokens off` | 🔴 Media — 0 de 13 comprobaciones. Además el enlace de recuperación lleva el token en la URL y sin `Referrer-Policy` puede filtrarse por la cabecera Referer | DEF-FE-05 |
| Dependencias | 0 vulnerabilidades altas/críticas en producción | 🔴 `npm audit`: 2 altas (`xlsx` sin arreglo: prototype pollution y ReDoS; `tmp`: escritura por enlace simbólico). Con devDependencies: 14 altas (`@typescript-eslint`, `tailwindcss` y transitivas). `postgres` (cliente de BD) figura en `dependencies` del front sin motivo aparente | `npm run test:audit`, DEF-FE-06 |

**Resumen front:** 51 pruebas nuevas de seguridad en verde; 17 aserciones de defectos fallan a propósito; la auditoría de dependencias no cumple.

Defectos del front registrados en esta entrega (los DEF-FE-01 a 03 anteriores están corregidos, ver `INFORME-RQ18-RQ25.md`):

| ID | Descripción | RQ | Severidad | Evidencia |
|---|---|---|---|---|
| DEF-FE-04 | `Login` navega a cualquier valor de `redirectTo` sin validarlo | RQ2 | Baja | `src/test/defects/DEF-FE-04-…` |
| DEF-FE-05 | Despliegue sin CSP, X-Frame-Options, nosniff, Referrer-Policy, HSTS, gzip ni `server_tokens off` | RQ2/RQ3/RQ5 | Media | `src/test/defects/DEF-FE-05-…` |
| DEF-FE-06 | Dependencias con vulnerabilidades altas (`xlsx` sin arreglo, `tmp`) y `postgres` en el front | RQ1–RQ5 | Alta | `npm run test:audit` |
| DEF-FE-07 | Bundle inicial de 605 KB gzip, imagen de 1,2 MB y LCP móvil de 10,8 s | RQ2/RQ3/RQ5 | Media | `npm run perf:bundle`, `npm run perf:lighthouse` |

### 4.3 Rendimiento — Back

Los criterios de latencia parten de los ya usados en el proyecto (`carga/escenarios.mjs`: health 1 s, lecturas 3 s) y se completan con el costo medido de bcrypt (≈ 0,32 s por hash con 12 rondas).

#### a) Costo propio del back (BD simulada, `npm run test:performance`)

| Escenario | Concurrencia | Criterio (p95) | Mediana | p95 | Resultado |
|---|---|---|---|---|---|
| Hash / verificación bcrypt | 1 | mediana ≤ 600 ms | 319 / 318 ms | 330 ms | 🟢 |
| Login (RQ2) | 1 | ≤ 600 ms | 318 ms | 332 ms | 🟢 |
| Login (RQ2) | 10 | ≤ 2 500 ms | 646 ms | 964 ms | 🟢 |
| Login (RQ2) | 50 | ≤ 10 000 ms | 2 267 ms | 3 880 ms | 🟢 (ver interpretación) |
| Login con correo inexistente (sin bcrypt) | 50 | ≤ 100 ms | 42 ms | 47 ms | 🟢 |
| create-user (RQ1) | 1 / 10 | ≤ 700 / 3 000 ms | 321 / 661 ms | 339 / 981 ms | 🟢 |
| forgot-password (RQ3.1) | 50 | ≤ 200 ms | 47 ms | 49 ms | 🟢 |
| validate-reset-token (RQ3.4) | 50 | ≤ 100 ms | 35 ms | 38 ms | 🟢 |
| reset-password (RQ5) | 1 / 10 | ≤ 700 / 3 000 ms | 314 / 648 ms | 337 / 968 ms | 🟢 |

#### b) Carga contra el back local con Supabase real (`npm run test:carga:*`)

Criterio: p95 ≤ umbral del escenario y errores ≤ 1 % en todas las etapas. Umbrales: forgot-password 2 000 ms, validate-reset-token 1 500 ms, reset-password (token inválido) 1 500 ms, create-user sin token 1 000 ms, health 1 000 ms.

| Perfil | Etapas (usuarios virtuales) | p95 forgot-password | p95 validate-token | p95 reset-password | p95 create-user (401) | Errores | Resultado |
|---|---|---|---|---|---|---|---|
| carga | 1 → 5 → 10 → 25 (15 s c/u) | 1 231 → 469 → 638 → 900 ms | 1 023 → 464 → 536 → 560 ms | 486 → 532 → 613 → 578 ms | 11 → 16 → 16 → 28 ms | 0 % | 🟢 |
| pico | 5 → **50** → 5 (15 s c/u) | 579 → 1 318 → 458 ms | 457 → 854 → 313 ms | 434 → 1 437 → 492 ms | 14 → 50 → 8 ms | 0 % | 🟢 se recupera al volver a 5 |
| estrés | 10 → 25 → 50 → 100 → **150** | 619 → 923 → 931 → 1 206 → 1 263 ms | 613 → 562 → 997 → 1 209 → 1 346 ms | 824 → 590 → 1 315 → 1 194 → 1 355 ms | 19 → 25 → 49 → 78 → 74 ms | 0 % | 🟢 no se llegó al punto de quiebre |
| soak | 10 usuarios, 150 s, 200 ms de pausa | 885 ms | 668 ms | 638 ms | 12 ms | 0 % (4 175 peticiones) | 🟢 |

Throughput máximo observado: ≈ 443 rps en total con 150 usuarios (≈ 88 rps por escenario) sin errores. Memoria del back (RSS) en el soak: 109 MB al arrancar → 218 MB de pico → 204 MB al final; después de los primeros 75 s oscila entre 199 y 218 MB (patrón de recolección de basura, sin crecimiento sostenido). Criterio: crecimiento ≤ 20 % tras el calentamiento → 🟢 (con la reserva de que son 150 s, no 10 min).

#### c) Línea base contra Render (plan gratuito, 1 usuario, 10 s)

| Escenario | p50 | p95 | Resultado |
|---|---|---|---|
| health | 205 ms | 212 ms | 🟢 |
| forgot-password | 335 ms | 535 ms | 🟢 |
| validate-reset-token | 307 ms | 409 ms | 🟢 |
| reset-password (token inválido) | 310 ms | 513 ms | 🟢 |
| create-user sin token (401) | 206 ms | 620 ms | 🟢 |

Solo 6–7 muestras por escenario: sirve de referencia, no de p95 estadísticamente sólido. El servidor estaba despierto (791 ms de arranque).

### 4.4 Rendimiento — Front

| Métrica | Criterio | Resultado | Estado |
|---|---|---|---|
| Render de Login / ForgotPassword / ResetPassword (jsdom) | mediana ≤ 60 / 40 / 40 ms | 6,0 / 3,7 / 2,7 ms | 🟢 |
| Montar la lista de 1 000 / 5 000 usuarios (paginada) | ≤ 300 / 500 ms | 47 / 38 ms | 🟢 |
| Buscar entre 5 000 usuarios | ≤ 300 ms | 19 ms | 🟢 |
| Validaciones por pulsación; correo sin ReDoS (100 000 caracteres) | ≤ 0,2 ms; ≤ 100 ms | < 0,01 ms; 0,05 ms | 🟢 |
| **JS inicial (gzip)** | ≤ 300 KB | **605 KB** (2 021 KB sin comprimir; un único archivo `index-*.js`) | 🔴 |
| **JS+CSS inicial (gzip)** | ≤ 350 KB | **613 KB** | 🔴 |
| Imagen individual | ≤ 500 KB | **`fondo.webp` 1 203 KB** | 🔴 |
| Carga estática (`vite preview`): HTML de login, recuperación, restablecer y fallback SPA | p95 ≤ 300 ms, errores ≤ 1 % hasta 100 usuarios | p95 6–11 ms (1 usuario) → 65–68 ms (100 usuarios), 0 % errores | 🟢 |
| Carga estática: descargar el JS principal (2 MB) | p95 ≤ 600 ms | 211 ms (10 usuarios) → 976 ms (50) → 2 029 ms (100), en loopback | 🔴 a partir de 50 usuarios |
| Lighthouse **escritorio** (login / recuperar / restablecer) | Performance ≥ 80, LCP ≤ 2,5 s, TBT ≤ 200 ms, CLS ≤ 0,1, FCP ≤ 1,8 s | 92 / 92 / 92; LCP 1,84 / 1,80 / 1,84 s; TBT 35 / 6 / 3 ms; CLS 0 | 🟢 |
| Lighthouse **móvil** (4× CPU, 4G lenta) | mismos umbrales | Performance 58 / 58 / 54; **LCP 10,8 / 10,8 / 11,0 s**; FCP 3,9 s; TBT 333 / 339 / 458 ms | 🔴 |

## 5. Interpretación de los resultados

1. **El hallazgo más grave no es de rendimiento sino de diseño: `POST /api/auth/register` (DEF-39).** Anula el control de RQ1: cualquiera puede registrarse como administrador y recibir un JWT, sin pasar por `create-user`. Es la prioridad cero.
2. **No hay ningún freno a los intentos repetidos (DEF-34, DEF-43).** El back aguantó 150 usuarios simultáneos sin un solo error, y precisamente por eso un atacante puede enviar miles de intentos de login, de tokens de recuperación o de correos de «olvidé mi contraseña» sin recibir un 429. La robustez actual juega a favor del abuso.
3. **bcrypt es el cuello de botella del login y a la vez una superficie de denegación de servicio.** Cada verificación cuesta ≈ 0,32 s y se ejecuta en el pool de 4 hilos de libuv: la capacidad teórica es ≈ 12 logins/s (la prueba lo confirma: 100 logins en ≈ 9 s). Con 50 logins simultáneos el p95 sube a 3,9 s y, como ese pool lo comparten otras operaciones del proceso (DNS, archivos), una avalancha de logins con clave mala degrada también el resto. Por contraste, un login con correo inexistente cuesta 4 ms: ahí está además la fuga de DEF-41 (el atacante distingue cuentas por tiempo).
4. **El resto de los endpoints de recuperación son baratos y escalan.** forgot-password, validate-token y reset con token inválido son lecturas a Supabase (≈ 150–200 ms de p50 por la red a la nube) y mantuvieron p95 ≤ 1,4 s con 150 usuarios. El pico 5 → 50 → 5 se absorbió y las latencias volvieron a su nivel base.
5. **Sin fugas aparentes de memoria**, aunque la prueba (150 s) es demasiado corta para descartarlas; se recomienda un soak de 10 min antes de producción.
6. **En el front, el problema es el peso del bundle, no el código de las pantallas.** Las pantallas se montan en pocos milisegundos, pero el usuario descarga 605 KB comprimidos (2 MB sin comprimir) y una imagen de 1,2 MB antes de ver el login, sin `React.lazy`, sin separación de librerías pesadas (`exceljs`, `xlsx`, `jspdf`, `html2canvas`, `recharts`) y con `nginx` sin gzip. En escritorio Lighthouse da 92 puntos; en un móvil con red lenta el LCP es de 10,8 s y la nota de 54–58. Para estudiantes que entran desde el celular, el criterio de LCP ≤ 2,5 s está lejos de cumplirse.
7. **La superficie de XSS está bien contenida hoy** (todo se pinta como texto, 51 pruebas lo confirman) pero **el JWT en `localStorage` y la ausencia total de cabeceras de seguridad (CSP, Referrer-Policy) eliminan la segunda barrera**: un solo XSS futuro (o la dependencia `xlsx` con prototype pollution, sin arreglo disponible) bastaría para robar sesiones. El token de recuperación viaja en la URL y sin `Referrer-Policy` puede filtrarse hacia terceros.

## 6. Mejoras propuestas (priorizadas)

| # | Prioridad | Mejora | Defecto / métrica que cierra | Esfuerzo |
|---|---|---|---|---|
| 1 | P0 | Deshabilitar `POST /register` o forzar `tipo_usuario = 'estudiante'` en el servidor | DEF-39 | Bajo |
| 2 | P0 | `express-rate-limit` (con `trust proxy` en Render): login 10 fallos/15 min por IP+correo; forgot-password 5/hora por correo; validate y reset 10/15 min por IP | DEF-34, DEF-43 | Bajo |
| 3 | P1 | `helmet` en el back y bloque de cabeceras en `nginx.conf` y `vercel.json` (CSP, X-Frame-Options, nosniff, Referrer-Policy `no-referrer`, HSTS) + `gzip on` y `server_tokens off` | DEF-35, DEF-FE-05 | Bajo |
| 4 | P1 | Comparar contra un hash ficticio cuando el usuario no existe (igualar tiempos) | DEF-41 | Bajo |
| 5 | P1 | Manejador global de errores que no copie `error.message` y responda JSON en 400/413 | DEF-40, DEF-31, DEF-38 | Bajo |
| 6 | P1 | `React.lazy` por ruta, `manualChunks` para `exceljs/xlsx/jspdf/html2canvas/recharts`, cargar bajo demanda las librerías de exportación y recomprimir `fondo.webp` (< 150 KB, `srcset`) | bundle 605 → < 300 KB gzip; LCP móvil < 2,5 s | Medio |
| 7 | P1 | Reemplazar `xlsx@0.18.5` (sin arreglo) por `exceljs` o la versión del CDN oficial de SheetJS; actualizar `tmp`; mover `postgres` fuera del front; planificar `tailwindcss` 4 y `@typescript-eslint` 8 | DEF-FE-06 | Medio |
| 8 | P2 | Guardar `password_changed_at` (o `token_version`) y rechazar JWT anteriores; invalidar los tokens de recuperación previos al emitir uno nuevo | DEF-42, DEF-44 | Medio |
| 9 | P2 | Usar `validarFortalezaPassword` también en `create-user` y `register`; validar `tipo_usuario` con lista cerrada | DEF-45, DEF-21 | Bajo |
| 10 | P2 | Validar `redirectTo` (solo rutas que empiecen por una `/`) | DEF-FE-04 | Bajo |
| 11 | P2 | Limitar la concurrencia de bcrypt (cola con tope) o subir `UV_THREADPOOL_SIZE` y bajar a 11 rondas solo si se compensa con el límite de intentos | capacidad de login | Medio |
| 12 | P3 | Mover el JWT a cookie `httpOnly; Secure; SameSite=Lax` (o mantener `localStorage` con CSP estricta) y acortar su vida con refresh token | riesgo del JWT en el navegador | Alto |
| 13 | P3 | Automatizar en Jenkins (etapas no bloqueantes): `test:security`, `test:performance`, `test:audit`, `perf:bundle`; Lighthouse y carga como corrida programada | continuidad de las métricas | Bajo |

## 7. Limitaciones de las mediciones

- **No se midió el login válido, la creación real de usuarios ni el envío real de correos contra Supabase**: requieren una cuenta de prueba (`LOGIN_EMAIL`, `LOGIN_PASSWORD`) y crean datos reales (`CREAR_USUARIOS=true`, solo contra localhost). El costo de bcrypt se midió con la base simulada (tabla 4.3a), que es el componente dominante, pero no incluye las 2–3 consultas reales a Supabase (≈ 150–200 ms cada una desde este equipo).
- Las pruebas de carga contra el back usaron **localhost → Supabase real** (la latencia de red a la nube está incluida, la de un navegador al back no). Render se midió solo con 1 usuario y 6–7 muestras por escenario.
- El soak fue de **150 s**, no de 10 min (el perfil `soak` usa 600 s por defecto).
- El servidor de carga y los usuarios virtuales corrieron en el mismo equipo; en el estrés a 150 usuarios parte de la latencia es competencia por CPU entre ambos.
- La carga del front se hizo con `vite preview` por loopback, no con `nginx` ni con Vercel; por eso la compresión observada (gzip en `vite preview`) no es la del despliegue de Jenkins, donde nginx **no** comprime.
- Lighthouse usa throttling simulado; sirve para comparar antes y después, no como medida exacta de un dispositivo real.
- Las pruebas de seguridad del back usan la base simulada: verifican la lógica del endpoint, no las políticas de Supabase (RLS), que quedan fuera de alcance.
- La seguridad de dependencias depende del estado de `npm audit` del día de ejecución.
- Para poder ejecutar las suites se instalaron en `node_modules` dependencias ya declaradas pero ausentes (`qrcode` en el back, `sonner` en el front); `package.json` y los lockfiles no cambiaron por ello.

## 8. Cómo reproducir

```bash
# ---------- Back (EntreAulas_Back) ----------
npm run test:security                         # controles (deben pasar)
npx vitest run --config vitest.defects.config.mts src/test/defects/DEF-39 src/test/defects/DEF-4   # defectos (fallan a propósito)
npm run test:performance                      # costo propio con BD simulada → reports/rendimiento/back-rq1-rq5.json

PORT=3100 npm run dev &                       # back local contra Supabase
PID=$(ss -ltnp | grep ':3100' | sed -E 's/.*pid=([0-9]+).*/\1/')
export API_URL=http://localhost:3100 PID_BACK=$PID
npm run test:carga:rq1-rq5                    # etapas manuales (ETAPAS, DURACION_S)
npm run test:carga:pico                       # 5 → 50 → 5
npm run test:carga:estres                     # hasta 150 usuarios
npm run test:carga:soak                       # 600 s (DURACION_S=150 para la versión corta)
# Cuenta de prueba para login válido: LOGIN_EMAIL=... LOGIN_PASSWORD=...
# Alta real de usuarios (solo local): CREAR_USUARIOS=true TOKEN_FILE=token-admin.txt
npm run test:carga:smoke                      # línea base contra Render (1 usuario)
# Reportes: reports/carga/*.json|md

# ---------- Front (EntreAulas_Front) ----------
npm run test:security                         # controles (deben pasar)
npm run test:defects                          # defectos (fallan a propósito)
npm run test:performance                      # render y validaciones → reports/rendimiento/front-rq1-rq5.json
npm run test:audit                            # npm audit (TODAS=true incluye devDependencies)
npm run build && npm run perf:bundle          # peso del bundle → reports/rendimiento/bundle.json
npx vite preview --port 4173 &
npm run perf:carga                            # carga estática → reports/carga/carga-front-*.json
npm run perf:lighthouse                       # PERFIL=movil para el perfil móvil; usa el Chromium de Playwright
```
