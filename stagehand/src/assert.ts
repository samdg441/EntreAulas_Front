export function assertIncludes(actual: string, expected: string, message: string): void {
  if (!actual.toLowerCase().includes(expected.toLowerCase())) {
    throw new Error(`${message}\nEsperado: ${expected}\nActual: ${actual}`)
  }
}

export function assertEquals(actual: string, expected: string, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}\nEsperado: ${expected}\nActual: ${actual}`)
  }
}
