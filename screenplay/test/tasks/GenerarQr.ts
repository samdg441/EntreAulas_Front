import { Task } from '@serenity-js/core'
import { Click } from '@serenity-js/web'

import { GeneracionQr } from '../ui/GeneracionQr'

export const ConfirmarGeneracionDeQr = () =>
  Task.where('#actor confirma la generación de QR', Click.on(GeneracionQr.confirmar()))
