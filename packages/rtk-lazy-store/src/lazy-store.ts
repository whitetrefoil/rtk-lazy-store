import type {
  Action,
  AnyAction,
  CombinedState,
  ConfigureStoreOptions,
  EnhancedStore,
  Middleware,
  Reducer,
} from '@reduxjs/toolkit'
import {combineReducers, configureStore} from '@reduxjs/toolkit'
import type {ThunkMiddlewareFor} from '@reduxjs/toolkit/dist/getDefaultMiddleware.js'


type Middlewares<S> = ReadonlyArray<Middleware<{}, S>>

export interface LazyStore<S,
  A extends Action = AnyAction,
  M extends Middlewares<S> = [ThunkMiddlewareFor<S>],
> extends EnhancedStore<CombinedState<S>, A, M> {
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


export type CreateLazyStore<S, A extends Action = AnyAction, M extends Middlewares<S> = [ThunkMiddlewareFor<S>]> =
  Omit<ConfigureStoreOptions<CombinedState<S>, A, M>, 'reducer'>


export function createLazyStore<S, A extends Action = AnyAction, M extends Middlewares<S> = [ThunkMiddlewareFor<S>]>(
  staticReducers: {
    [K in keyof S]: (state: S[K]|undefined, action: A) => S[K]
  },
  createLazyStoreOptions?: CreateLazyStore<S, A, M>,
) {

  function injectModuleManager<M extends ReadonlyArray<Middleware<{}, S>>>(store: EnhancedStore<CombinedState<S>, A, M>): LazyStore<S, A, M> {
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

  function createReducer(): Reducer<CombinedState<S>, A> {
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
