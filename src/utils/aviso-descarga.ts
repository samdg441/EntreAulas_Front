import { toast } from 'sonner'

export type TipoDescarga = 'excel' | 'pdf' | 'imagen'

const MENSAJES: Record<TipoDescarga, string> = {
  excel: 'Excel descargado correctamente',
  pdf: 'PDF descargado correctamente',
  imagen: 'Imagen descargada correctamente',
}

export function avisarDescarga(tipo: TipoDescarga, archivo: string) {
  toast.success(MENSAJES[tipo], { description: archivo })
}
