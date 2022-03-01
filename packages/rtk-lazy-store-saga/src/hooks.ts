import type { AnyAction } from '@reduxjs/toolkit'
import { useEffect } from 'react'
import { useStore } from 'react-redux'
import type { AnySaga, LazyStoreSaga } from './lazy-store'


export function createUseLazyReducer<RootState>(cleanReducer = false) {
  return <Key extends keyof RootState>(
    key: Key,
    reducer?: (state: RootState[Key], action: AnyAction) => RootState[Key],
    saga?: AnySaga,
  ) => {
    const store = useStore() as unknown as LazyStoreSaga<RootState>

    useEffect(() => {
      store.moduleManager.enter(key, reducer, saga)

      return () => {
        store.moduleManager.leave(key, cleanReducer)
      }
    }, [key, reducer, saga, store.moduleManager])
  }
}
