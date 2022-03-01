import type {
  Action,
  AnyAction,
  ConfigureStoreOptions,
  EnhancedStore,
  LazyStore,
  Middleware,
  Reducer,
} from '@reduxjs/toolkit'
import { combineReducers, configureStore } from '@reduxjs/toolkit'


type Middlewares<S> = ReadonlyArray<Middleware<{}, S>>

declare module 'redux' {
  export interface LazyStore<S,
    A extends Action = AnyAction,
    M extends Middlewares<S> = Middlewares<S>,
    > extends EnhancedStore<S, A, M> {
    moduleManager: {
      /**
       * @returns Whether newly added or not
       */
      enter: <K extends keyof S>(
        key: K,
        reducer?: (state: S[K], action: A) => S[K],
      ) => boolean
      leave: <K extends keyof S>(key: K, clean?: boolean) => void
    }
  }
}


export type CreateLazyStore<S, A extends Action = AnyAction, M extends Middlewares<S> = Middlewares<S>> =
  Omit<ConfigureStoreOptions<S, A, M>, 'reducer'>


export function createLazyStore<S, A extends Action = AnyAction, M extends Middlewares<S> = Middlewares<S>>(
  staticReducers: {
    [K in keyof S]: (state: S[K]|undefined, action: A) => S[K]
  },
  createLazyStoreOptions?: CreateLazyStore<S, A, M>,
) {

  function injectModuleManager<M extends ReadonlyArray<Middleware<{}, S>>>(store: EnhancedStore<S, A, M>): LazyStore<S, A, M> {
    (store as LazyStore<S, A, M>).moduleManager = {
      enter: (key, reducer?) => {
        let isNew = true
        if (Object.prototype.hasOwnProperty.call(lazyReducers, key)) {
          isNew = false
        } else {
          lazyReducers[key] = reducer
          const newReducer = createReducer()
          store.replaceReducer(newReducer)
        }
        return isNew
      },

      leave: (key, clean = false) => {
        if (clean !== true) {
          return
        }
        const toBeRemoved = lazyReducers[key]
        if (toBeRemoved == null) {
          return
        }
        delete lazyReducers[key]
        const newReducer = createReducer()
        store.replaceReducer(newReducer)
      },
    }
    return store as LazyStore<S, A, M>
  }

  type RM = {
    [K in keyof S]: (state: S[K], action: A) => S[K]
  }

  const lazyReducers: Partial<RM> = {}

  function createReducer(): Reducer<S, A> {
    return combineReducers({
      ...staticReducers,
      ...lazyReducers,
    })
  }

  const store = configureStore({
    reducer: createReducer(),
    ...createLazyStoreOptions,
  })

  return injectModuleManager(store)
}
