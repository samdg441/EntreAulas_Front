import { Given } from '@cucumber/cucumber'

export function paso(texto: string, fn: (...args: any[]) => Promise<void>) {
  Given(texto, fn)
  Given(`que ${texto}`, fn)
}
