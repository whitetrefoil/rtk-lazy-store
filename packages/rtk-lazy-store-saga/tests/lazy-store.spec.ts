import { createLazyStore } from '~/lazy-store'
import { cancelled } from 'redux-saga/effects'


test('simple usage', () => {
  interface RootState {
    thisIsStatic: number
    thisIsDynamic?: string
  }

  const thisIsStaticReducer = (state?: number) => state ?? 0

  const staticReducer = {
    thisIsStatic: thisIsStaticReducer,
  }

  function *staticSaga() {
    while (true) {
      if ((yield cancelled()) as boolean) {
        return
      }
    }
  }

  const store = createLazyStore<RootState>(staticReducer, staticSaga, {})

  expect(store.getState()).toEqual({
    thisIsStatic: 0,
  })
  expect(store.getState()).not.toHaveProperty('thisIsDynamic')

  // Add new module
  store.moduleManager.enter('thisIsDynamic', s => s ?? 'default')

  expect(store.getState()).toEqual({
    thisIsStatic : 0,
    thisIsDynamic: 'default',
  })

  // Silent when exists
  store.moduleManager.enter('thisIsDynamic', s => s ?? 'default')

  expect(store.getState()).toEqual({
    thisIsStatic : 0,
    thisIsDynamic: 'default',
  })

  // Leave w/o clean
  store.moduleManager.leave('thisIsDynamic')
  expect(store.getState()).toEqual({
    thisIsStatic : 0,
    thisIsDynamic: 'default',
  })

  // Leave w/ clean
  store.moduleManager.leave('thisIsDynamic', true)
  expect(store.getState()).toEqual({
    thisIsStatic: 0,
  })
  expect(store.getState()).not.toHaveProperty('thisIsDynamic')
})
