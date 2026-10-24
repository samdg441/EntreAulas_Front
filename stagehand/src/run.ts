export function run(main: () => Promise<void>): void {
  main().catch((error: unknown) => {
    console.error('La prueba falló:', error)
    process.exitCode = 1
  })
}
