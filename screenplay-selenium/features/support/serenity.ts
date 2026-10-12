import { Before, setDefaultTimeout } from '@cucumber/cucumber'
import { browser } from '@wdio/globals'
import { Cast, Actor, engage, TakeNotes } from '@serenity-js/core'
import { CallAnApi } from '@serenity-js/rest'
import { BrowseTheWebWithWebdriverIO } from '@serenity-js/webdriverio'

import { apiUrl } from '../../test/support/entorno'

class Elenco implements Cast {
  prepare(actor: Actor): Actor {
    return actor.whoCan(
      BrowseTheWebWithWebdriverIO.using(browser),
      CallAnApi.using({ baseURL: apiUrl(), timeout: 30_000, validateStatus: () => true }),
      TakeNotes.usingAnEmptyNotepad(),
    )
  }
}

setDefaultTimeout(60_000)

Before(() => {
  engage(new Elenco())
})
