import { map } from 'rxjs'
import { filterNullish } from 'ts-ratchet'
import { IStashTab, IStashTabNode } from '../interfaces/stash.interface'
import { PoeItem } from 'sage-common'
import { StashTab } from '../store/domains/stashtab'
import { context } from '../context'

export const valuateItems = (league: string, items: PoeItem[]) => {
  const { poeValuations } = context()
  return poeValuations.withValuations(league, items).pipe(
    map((e) => {
      if (e.type === 'error') {
        console.log(e.error.stack)
        throw new Error(e.error)
      }
      if (e.type === 'result') {
        return e.result
      }
      return null
    }),
    filterNullish()
  )
}

export const getProfile = () => {
  const { poeAccounts } = context()
  return poeAccounts.profile().pipe(
    map((e) => {
      if (e.type === 'error') {
        console.log(e.error.stack)
        throw new Error(e.error)
      }
      if (e.type === 'result') {
        return e.result
      }
      return null
    }),
    filterNullish()
  )
}

export const getLeagues = () => {
  const { poeAccounts } = context()
  return poeAccounts.leagues().pipe(
    map((e) => {
      if (e.type === 'error') {
        console.log(e.error.stack)
        throw new Error(e.error)
      }
      if (e.type === 'result') {
        return e.result
      }
      return null
    }),
    filterNullish()
  )
}

export const getCharacters = () => {
  const { poeCharacters } = context()
  return poeCharacters.characterList().pipe(
    map((e) => {
      if (e.type === 'error') {
        console.log(e.error.stack)
        throw new Error(e.error)
      }
      if (e.type === 'result') {
        return e.result
      }
      return null
    }),
    filterNullish()
  )
}

export const getCharacter = (character: string) => {
  const { poeCharacters } = context()
  return poeCharacters.character(character).pipe(
    map((e) => {
      if (e.type === 'error') {
        console.log(e.error.stack)
        throw new Error(e.error)
      }
      if (e.type === 'result') {
        return e.result
      }
      return null
    }),
    filterNullish()
  )
}

export const getStashTabs = (league: string) => {
  const { poeStash } = context()
  return poeStash.stashes(league).pipe(
    map((e) => {
      if (e.type === 'error') {
        console.log(e.error.stack)
        throw new Error(e.error)
      }
      if (e.type === 'result') {
        return e.result
      }
      return null
    }),
    filterNullish()
  )
}
export const getStashTabWithChildren = (stash: IStashTab, league: string, children?: boolean) => {
  const { poeStash } = context()
  const prefix = stash.parent && children ? `${stash.parent}/` : ''
  const stashId = `${prefix}${stash.id}`

  return poeStash.stashTab(league, stashId).pipe(
    map((e) => {
      if (e.type === 'error') {
        console.log(e.error.stack)
        throw new Error(e.error)
      }
      if (e.type === 'result') {
        return e.result
      }
      return null
    }),
    filterNullish()
  )
}

export default {
  valuateItems,
  getProfile,
  getLeagues,
  getCharacters,
  getCharacter,
  getStashTabs,
  getStashTabWithChildren
}
