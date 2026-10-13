import { isPresent } from '@serenity-js/assertions'
import { Task, Wait } from '@serenity-js/core'
import { Click, Scroll, isVisible } from '@serenity-js/web'

import { ResumenIa } from '../ui/ResumenIa'

export const GenerarResumen = () =>
  Task.where('#actor genera el resumen de IA',
    Wait.until(ResumenIa.generar(), isPresent()),
    Scroll.to(ResumenIa.generar()),
    Wait.until(ResumenIa.generar(), isVisible()),
    Click.on(ResumenIa.generar()),
  )
