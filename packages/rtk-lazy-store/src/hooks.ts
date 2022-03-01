import type { AnyAction, LazyStore } from '@reduxjs/toolkit'
import { useEffect } from 'react'
import { useStore } from 'react-redux'


export function createUseLazyReducer<RootState>(cleanReducer = false) {
  return <Key extends keyof RootState>(
    key: Key,
    reducer?: (state: RootState[Key], action: AnyAction) => RootState[Key],
  ) => {
    const store = useStore() as unknown as LazyStore<RootState>

    useEffect(() => {
      store.moduleManager.enter(key, reducer)

      return () => {
        store.moduleManager.leave(key, cleanReducer)
      }
    }, [key, reducer, store.moduleManager])
  }
}
