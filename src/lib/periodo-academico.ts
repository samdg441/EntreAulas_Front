/** Código del periodo según la fecha: enero–junio es año-1, julio–diciembre es año-2. */
export function codigoPeriodoActual(hoy = new Date()): string {
  const semestre = hoy.getMonth() < 6 ? 1 : 2
  return `${hoy.getFullYear()}-${semestre}`
}

/** Límites del semestre en curso. El primer semestre va de enero a junio. */
export function limitesPeriodoAcademico(hoy = new Date()): { min: string; max: string } {
  const ano = hoy.getFullYear()
  const primerSemestre = hoy.getMonth() < 6
  const mesInicio = primerSemestre ? '01' : '07'
  const mesFin = primerSemestre ? '06' : '12'
  const diaFin = primerSemestre ? '30' : '31'
  return {
    min: `${ano}-${mesInicio}-01`,
    max: `${ano}-${mesFin}-${diaFin}`,
  }
}

export function fechaDentroDelPeriodo(valor: string, hoy = new Date()): boolean {
  if (!valor) return true
  const { min, max } = limitesPeriodoAcademico(hoy)
  return valor >= min && valor <= max
}
