# Guiones de grabación en BugBug para RQ1–RQ5

En cada paso, **acción** es lo que se hace en la ventana de grabación y **assert** es la verificación que se agrega con *Add assertion*. Los selectores son los que BugBug suele elegir; si graba otros equivalentes, déjalos.

## Componente: Login como admin
| # | Acción | Elemento / valor |
|---|---|---|
| 1 | Go to URL | `{{url}}/login` |
| 2 | Click | botón "Estudiante ▾" (selector de tipo) |
| 3 | Click | opción "Administrador" |
| 4 | Type | `input[type=email]` → `{{admin_email}}` |
| 5 | Type | `input[type=password]` → `{{admin_password}}` |
| 6 | Click | botón "Iniciar sesión como Administrador" |
| 7 | Assert *Page URL contains* | `/dashboard-admin` |

## RQ2: Inicio de sesión

### BB-RQ2-01: Login de estudiante (exitoso)
| # | Acción | Elemento / valor |
|---|---|---|
| 1 | Go to URL | `{{url}}/login` |
| 2 | Type | correo → `{{estudiante_email}}` |
| 3 | Type | contraseña → `{{estudiante_password}}` |
| 4 | Click | "Iniciar sesión como Estudiante" |
| 5 | Assert *Page URL contains* | `/dashboard-estudiante` |
| 6 | Assert *Custom JavaScript* | `return !!localStorage.getItem('token')` |

### BB-RQ2-02: Clave incorrecta (error)
| # | Acción | Elemento / valor |
|---|---|---|
| 1 | Go to URL | `{{url}}/login` |
| 2 | Type | correo → `{{estudiante_email}}` |
| 3 | Type | contraseña → `Incorrecta#2026` |
| 4 | Click | "Iniciar sesión como Estudiante" |
| 5 | Assert *Text contains* | `Credenciales inválidas` |
| 6 | Assert *Page URL contains* | `/login` |
| 7 | Assert *Custom JavaScript* | `return localStorage.getItem('token') === null` |

### BB-RQ2-03: Tipo equivocado (alternativo)
| # | Acción | Elemento / valor |
|---|---|---|
| 1 | Go to URL | `{{url}}/login` |
| 2 | Click | selector de tipo → "Docente" |
| 3 | Type | correo y clave del estudiante |
| 4 | Click | "Iniciar sesión como Docente" |
| 5 | Assert *Text contains* | `no coincide con tu cuenta` |

### BB-RQ2-04: Correo sin arroba (error)
| # | Acción | Elemento / valor |
|---|---|---|
| 1 | Go to URL | `{{url}}/login` |
| 2 | Type | correo → `correo-sin-arroba` |
| 3 | Assert *Text contains* | `Por favor, ingresa un correo electrónico válido` |

## RQ1: Registro desde el administrador

### BB-RQ1-01: Crear estudiante (exitoso)
| # | Acción | Elemento / valor |
|---|---|---|
| 1 | Run component | Login como admin |
| 2 | Go to URL | `{{url}}/admin/users` |
| 3 | Click | "Agregar usuario" |
| 4 | Custom JavaScript (guardar variable `usuario`) | `return 'bb.' + Date.now()` |
| 5 | Type | `#nombre` → `BUGBUG` |
| 6 | Type | `#apellido` → `PRUEBA` |
| 7 | Type | `#correo-institucional` → `{{usuario}}` |
| 8 | Type | `#contraseña` → `{{clave_valida}}` |
| 9 | Click | "Crear" |
| 10 | Assert *Element is not visible* | encabezado "Agregar usuario" |
| 11 | Type | buscador "Buscar por nombre, email o rol…" → `{{usuario}}` |
| 12 | Assert *Text contains* | `{{usuario}}@soyudemedellin.edu.co` |

### BB-RQ1-02: Clave débil (error)
| # | Acción | Elemento / valor |
|---|---|---|
| 1 | Run component | Login como admin |
| 2 | Go to URL | `{{url}}/admin/users` |
| 3 | Click | "Agregar usuario" |
| 4 | Type | nombre, apellido y usuario `bb.debil` |
| 5 | Type | `#contraseña` → `ClaveSegura2026` |
| 6 | Click | "Crear" |
| 7 | Assert *Text contains* | `al menos un carácter especial` |
| 8 | Assert *Element is visible* | encabezado "Agregar usuario" (el modal sigue abierto) |

### BB-RQ1-03: Correo duplicado (error)
Los pasos son los mismos que en BB-RQ1-01, pero en el paso 7 se escribe el usuario del estudiante de prueba (la parte antes de @ de `{{estudiante_email}}`).

| # | Acción | Elemento / valor |
|---|---|---|
| 10 | Assert *Text contains* | `ya está registrado` |

### BB-RQ1-04: Estudiante sin acceso (error)
| # | Acción | Elemento / valor |
|---|---|---|
| 1 | Ejecutar BB-RQ2-01 (pasos 1 a 5) | |
| 2 | Go to URL | `{{url}}/admin/users` |
| 3 | Assert *Text contains* | `Acceso no permitido` |

## RQ3.1 y RQ4: Solicitud del enlace

### BB-RQ3-01: Correo registrado (exitoso)
| # | Acción | Elemento / valor |
|---|---|---|
| 1 | Go to URL | `{{url}}/forgot-password` |
| 2 | Type | correo → `{{estudiante_email}}` |
| 3 | Click | "Enviar enlace de recuperación" |
| 4 | Assert *Text contains* | `Solicitud enviada` |
| 5 | Assert *Text contains* | `Si el correo electrónico existe en nuestro sistema` |

### BB-RQ3-02: Correo no registrado, misma respuesta (alternativo)
Los pasos son los de BB-RQ3-01 con el correo `nadie.bugbug@soyudemedellin.edu.co`. Los *asserts* son los mismos: la UI no debe cambiar.

### BB-RQ4-01: El correo llega (exitoso)
BugBug ofrece buzones de prueba (*Inbox*), según el plan: `{{inbox_email}}`.

| # | Acción | Elemento / valor |
|---|---|---|
| 1 | Crear un usuario de prueba con el correo del buzón de BugBug, o usar un buzón propio | |
| 2 | Ejecutar BB-RQ3-01 con ese correo | |
| 3 | *Inbox* → esperar el correo "Recuperación de contraseña - EntreAulas" | |
| 4 | Click | enlace "Restablecer contraseña" del correo |
| 5 | Assert *Page URL contains* | `/reset-password?token=` |

Si el plan no incluye buzón, captura el correo recibido y guárdalo en `evidencias/`.

## RQ3.2: Validación del token

### BB-RQ32-01: Token inexistente (error)
| # | Acción | Elemento / valor |
|---|---|---|
| 1 | Go to URL | `{{url}}/reset-password?token=ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff&email={{estudiante_email}}` |
| 2 | Assert *Text contains* | `Token inválido o ya utilizado` |
| 3 | Assert *Element is visible* | botón "Solicitar un nuevo enlace" |

### BB-RQ32-02: Enlace incompleto (error)
| # | Acción | Elemento / valor |
|---|---|---|
| 1 | Go to URL | `{{url}}/reset-password` |
| 2 | Assert *Text contains* | `inválido o está incompleto` |

## RQ5: Nueva contraseña

### BB-RQ5-01: Cambio con un enlace real (exitoso, continúa BB-RQ4-01)
| # | Acción | Elemento / valor |
|---|---|---|
| 1 | Type | `#nueva-contraseña` → `ClaveNueva#2027` |
| 2 | Type | `#confirmar-nueva-contraseña` → `ClaveNueva#2027` |
| 3 | Click | "Actualizar contraseña" |
| 4 | Assert *Text contains* | `Contraseña actualizada` |
| 5 | Click | "Ir al inicio de sesión" y entrar con la clave nueva |
| 6 | Assert *Page URL contains* | `/dashboard` |

### BB-RQ5-02: No coinciden (error)
| # | Acción | Elemento / valor |
|---|---|---|
| 1 | Abrir un enlace vigente | |
| 2 | Type | nueva → `ClaveNueva#2027`, confirmar → `OtraClave#2027` |
| 3 | Click | "Actualizar contraseña" |
| 4 | Assert *Text contains* | `Las contraseñas no coinciden` |

### BB-RQ5-03: Mostrar la contraseña (accesibilidad, DEF-FE-08)
| # | Acción | Elemento / valor |
|---|---|---|
| 1 | Abrir un enlace vigente y escribir una clave | |
| 2 | Click | botón del ojo. Anota qué selector grabó BugBug: antes de la refactorización no hay `aria-label`, así que guarda una ruta CSS frágil |
| 3 | Assert *Custom JavaScript* | `return document.querySelector('#nueva-contraseña').type === 'text'` |
