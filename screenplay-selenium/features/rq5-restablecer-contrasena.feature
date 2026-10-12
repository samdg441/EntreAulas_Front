# language: es
@RQ5 @web
Característica: RQ5 - Restablecer la contraseña
  Como usuario con un enlace de recuperación vigente
  Quiero definir una nueva contraseña
  Para recuperar el acceso a mi cuenta

  Antecedentes:
    Dado que Ana tiene una cuenta nueva con clave "ClaveVieja#2026"
    Y que ella recibió un enlace de recuperación vigente

  @exitoso
  Escenario: Cambia la contraseña y ya puede ingresar con la nueva
    Cuando ella abre el enlace de recuperación
    Y ella restablece su contraseña con "ClaveNueva#2027" y la confirma
    Entonces ve la confirmación "Contraseña actualizada"
    Y puede iniciar sesión con la clave "ClaveNueva#2027"

  @exitoso
  Escenario: La clave anterior deja de funcionar
    Cuando ella abre el enlace de recuperación
    Y ella restablece su contraseña con "ClaveNueva#2027" y la confirma
    Entonces ve la confirmación "Contraseña actualizada"
    Y no puede iniciar sesión con la clave "ClaveVieja#2026"

  @alternativo
  Escenario: Las contraseñas no coinciden
    Cuando ella abre el enlace de recuperación
    Y ella restablece su contraseña con "ClaveNueva#2027" y la confirma como "OtraClave#2027"
    Entonces ve el mensaje de error "Las contraseñas no coinciden"

  @alternativo
  Esquema del escenario: La contraseña nueva incumple la política
    Cuando ella abre el enlace de recuperación
    Y ella restablece su contraseña con "<clave>" y la confirma
    Entonces ve el mensaje de error "<motivo>"

    Ejemplos:
      | clave       | motivo      |
      | Ab#1        | 8 caracteres |
      | claveminus#1 | mayúscula   |
      | CLAVEMAYUS#1 | minúscula   |
      | ClaveSinNum# | número      |
      | ClaveSinEsp1 | especial    |

  @alternativo
  Escenario: Un enlace ya usado no sirve una segunda vez
    Cuando ella abre el enlace de recuperación
    Y ella restablece su contraseña con "ClaveNueva#2027" y la confirma
    Y ella abre de nuevo el mismo enlace de recuperación
    Entonces ve el mensaje de error "Token inválido"
    Y ve la opción de solicitar un nuevo enlace
