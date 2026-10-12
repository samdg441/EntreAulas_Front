import { describe, expect, it, vi } from 'vitest'
import { toast } from 'sonner'
import { avisarDescarga } from '../../../utils/aviso-descarga'

vi.mock('sonner', () => ({ toast: { success: vi.fn() } }))

/**
 * Cada exportación avisa con un toast que incluye el nombre del archivo,
 * así el usuario (y las pruebas E2E) saben que la descarga se generó.
 */
describe('aviso de descarga', () => {
  it.each([
    ['excel', 'Excel descargado correctamente', 'reporte-2026-1.xlsx'],
    ['pdf', 'PDF descargado correctamente', 'reporte-2026-1.pdf'],
    ['imagen', 'Imagen descargada correctamente', 'graficos-2026-1.png'],
  ] as const)('%s muestra "%s" con el nombre del archivo', (tipo, mensaje, archivo) => {
    // Act
    avisarDescarga(tipo, archivo)

    // Assert
    expect(toast.success).toHaveBeenLastCalledWith(mensaje, { description: archivo })
  })
})
