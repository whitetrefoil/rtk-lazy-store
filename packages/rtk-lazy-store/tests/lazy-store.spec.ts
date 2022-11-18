import { createLazyStore } from '~/lazy-store.js'

test('simple usage', () => {
  interface RootState {
    thisIsStatic: number
    thisIsDynamic?: string
  }

  const thisIsStaticReducer = (state?: number) => state ?? 0

  const staticReducer = {
    thisIsStatic: thisIsStaticReducer,
  }

  const store = createLazyStore<RootState>(staticReducer, {})

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
