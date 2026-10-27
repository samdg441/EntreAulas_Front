# Reporte de pruebas de TestSprite (MCP)

---

## 1️⃣ Metadatos del documento

- **Proyecto:** EntreAulas_Front, solo RQ1–RQ5.
- **Fecha:** 2026-10-26.
- **Preparado por:** TestSprite AI se encargó de generar y ejecutar las pruebas; el análisis es de Juliana Franco.
- **Entorno:** build de producción en nginx (`http://localhost:3001`) y API Express (`http://localhost:3000`), con la versión refactorizada, a través del túnel de TestSprite.
- **Ejecución:** los 12 casos del plan final, juntos en una sola corrida.

---

## 2️⃣ Validación por requisito

### RQ1: Registro de usuarios desde el administrador

| Caso | Resultado | Análisis |
|---|---|---|
| [TC006 Crear un usuario nuevo](./TC006_Crear_un_usuario_nuevo.py) | ✅ Pasa | El administrador crea `ts.<timestamp>` y el usuario aparece en la tabla |
| [TC009 El dominio cambia según el tipo](./TC009_El_dominio_del_correo_cambia_segn_el_tipo_de_usuario.py) | ✅ Pasa | En el modal de alta, el sufijo cambia de `@soyudemedellin.edu.co` a `@udemedellin.edu.co` |
| [TC011 Contraseña débil](./TC011_Rechazar_una_contrasea_dbil_en_el_alta.py) | ✅ Pasa | Se exige un carácter especial y el modal sigue abierto |
| [TC013 Correo duplicado](./TC013_Rechazar_un_correo_duplicado_en_el_alta.py) | ✅ Pasa | Muestra «El correo ya está registrado» |
| [TC014 Encontrar al usuario creado](./TC014_Encontrar_el_usuario_creado_en_la_tabla.py) | ✅ Pasa | El buscador encuentra el correo creado |

### RQ2: Inicio de sesión

| Caso | Resultado | Análisis |
|---|---|---|
| [TC001 Login como estudiante](./TC001_Iniciar_sesin_como_estudiante_y_llegar_a_su_panel.py) | ✅ Pasa | Llega a `/dashboard-estudiante` |
| [TC002 Login como docente](./TC002_Iniciar_sesin_como_docente_y_llegar_a_su_panel.py) | ✅ Pasa | Llega a `/dashboard-profesor` |
| [TC005 Credenciales incorrectas](./TC005_Rechazar_credenciales_incorrectas.py) | ✅ Pasa | Muestra «Credenciales inválidas» y se queda en `/login` |
| [TC007 Correo con formato inválido](./TC007_Rechazar_un_correo_con_formato_invlido_en_el_login.py) | ✅ Pasa | Muestra «Por favor, ingresa un correo electrónico válido» |

### RQ3.1, RQ3.2 y RQ4: Recuperación de contraseña

| Caso | Resultado | Análisis |
|---|---|---|
| [TC004 Solicitar el enlace](./TC004_Solicitar_un_enlace_de_recuperacin.py) | ✅ Pasa | Muestra la confirmación genérica. La llegada del correo no se puede observar |
| [TC008 Correo inválido](./TC008_Rechazar_un_correo_con_formato_invlido_en_la_recuperacin.py) | ✅ Pasa | Muestra el error de formato |
| [TC016 Enlace incompleto](./TC016_Manejar_un_enlace_de_recuperacin_incompleto.py) | ✅ Pasa | Muestra «El enlace de recuperación es inválido o está incompleto.» |

---

## 3️⃣ Cobertura y métricas

| Requisito | Casos | ✅ Pasan | ❌ Fallan |
|---|---|---|---|
| RQ1 | 5 | 5 | 0 |
| RQ2 | 4 | 4 | 0 |
| RQ3.1 / RQ4 | 2 | 2 | 0 |
| RQ3.2 | 1 | 1 | 0 |
| RQ5 | 0 | — | — |
| **Total** | **12** | **12 (100 %)** | **0** |

---

## 4️⃣ Brechas y riesgos

- **RQ5 y el envío real de RQ4 no están cubiertos:** el agente no tiene acceso a un buzón. Esos casos (TC003 y TC012) se retiraron del plan, y el flujo lo cubren Vitest, Cypress, Playwright y Stagehand.
- **Hallazgo abierto (TS-H7):** una cuenta con los roles de estudiante y administrador que inicia sesión como «Estudiante» puede entrar a `/admin/users`. El caso que lo detectó (TC015) se retiró del plan.
- **Veredicto del juez de IA:** en TC004, TC009, TC013 y TC016, el código exportado solo comprueba que la página cargó. La verificación está en la grabación del panel.
- **Datos fijos:** TC006 y TC014 dejan escrito en el código el usuario creado en su corrida.
- **Credenciales:** en el código, las credenciales se leen de variables de entorno (`TESTSPRITE_USER`, `TESTSPRITE_PASSWORD`, `TESTSPRITE_DOCENTE_USER` y `TESTSPRITE_DOCENTE_PASSWORD`).
