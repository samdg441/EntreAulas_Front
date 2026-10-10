import { defineParameterType } from '@cucumber/cucumber'
import { actorCalled, actorInTheSpotlight } from '@serenity-js/core'

defineParameterType({
  name: 'actor',
  regexp: /[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/,
  transformer: (nombre: string) => actorCalled(nombre),
})

defineParameterType({
  name: 'pronombre',
  regexp: /él|ella/,
  transformer: () => actorInTheSpotlight(),
})
