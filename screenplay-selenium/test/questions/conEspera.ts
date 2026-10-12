import { Duration, Question } from '@serenity-js/core'

export function conEspera<T>(pregunta: Question<Promise<T>>, hasta = Duration.ofSeconds(8)): Question<Promise<T>> {
  return Question.about<T>(pregunta.toString(), async actor => {
    const limite = Date.now() + hasta.inMilliseconds()
    for (;;) {
      try {
        return await actor.answer(pregunta)
      } catch (error) {
        if (Date.now() >= limite) throw error
        await new Promise(resolve => setTimeout(resolve, 250))
      }
    }
  })
}
