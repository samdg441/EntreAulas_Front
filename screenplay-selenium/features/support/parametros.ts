import { defineParameterType } from '@cucumber/cucumber'
import { actorCalled, actorInTheSpotlight } from '@serenity-js/core'

defineParameterType({
  name: 'quien',
  regexp: /[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+|ella|él/,
  transformer: (texto: string) => (texto === 'ella' || texto === 'él' ? actorInTheSpotlight() : actorCalled(texto)),
})
