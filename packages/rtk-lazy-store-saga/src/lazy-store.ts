import type { Action, AnyAction, ConfigureStoreOptions, EnhancedStore, Middleware, Reducer } from '@reduxjs/toolkit'
import { combineReducers, configureStore } from '@reduxjs/toolkit'
import type { ThunkMiddlewareFor } from '@reduxjs/toolkit/dist/getDefaultMiddleware'
import type { SagaMiddlewareOptions, Task } from 'redux-saga'
import createSagaMiddleware from 'redux-saga'


export type Middlewares<S> = ReadonlyArray<Middleware<{}, S>>

export type AnySaga = (...args: unknown[]) => Iterator<unknown, unknown, unknown>

export interface LazyStoreSaga<S,
  A extends Action = AnyAction,
  M extends Middlewares<S> = [ThunkMiddlewareFor<S>],
  > extends EnhancedStore<S, A, M> {
  moduleManager: {
    /**
     * @returns Whether newly added or not
     */
    enter: <K extends keyof S>(
      key: K,
      reducer?: (state: S[K], action: A) => S[K],
      saga?: AnySaga,
    ) => boolean
    leave: <K extends keyof S>(key: K, clean?: boolean) => void
  }
}

export interface CreateLazyStoreOptions<S, A extends Action = AnyAction, M extends Middlewares<S> = [ThunkMiddlewareFor<S>], C extends object = {}>
  extends Omit<ConfigureStoreOptions<S, A, M>, 'reducer'> {
  sagaMiddlewareOptions?: SagaMiddlewareOptions<C>
}


export function createLazyStore<S, A extends Action = AnyAction, M extends Middlewares<S> = [ThunkMiddlewareFor<S>], C extends object = {}>(
  staticReducers: {
    [K in keyof S]: (state: S[K]|undefined, action: A) => S[K]
  },
  staticSaga: AnySaga,
  createLazyStoreOptions?: CreateLazyStoreOptions<S, A, M, C>,
) {

  function injectModuleManager<M extends ReadonlyArray<Middleware<{}, S>>>(store: EnhancedStore<S, A, M>): LazyStoreSaga<S, A, M> {
    (store as LazyStoreSaga<S, A, M>).moduleManager = {
      enter: (key, reducer?, saga?) => {
        let isNew = true
        if (Object.prototype.hasOwnProperty.call(lazyReducers, key)) {
          isNew = false
        } else {
          lazyReducers[key] = reducer
          const newReducer = createReducer()
          store.replaceReducer(newReducer)
        }

        if (!Object.prototype.hasOwnProperty.call(lazySagas, key)) {
          const newTask = saga == null ? undefined : sagaMiddleware.run(saga)
          lazySagas[key] = newTask
        }

        return isNew
      },

      leave: (key, clean = false) => {
        if (Object.prototype.hasOwnProperty.call(lazySagas, key)) {
          const sagaToBeRemoved = lazySagas[key]
          if (sagaToBeRemoved != null) {
            sagaToBeRemoved.cancel()
          }
          delete lazySagas[key]
        }

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
    return store as LazyStoreSaga<S, A, M>
  }

  type RM = {
    [K in keyof S]: (state: S[K], action: A) => S[K]
  }

  const lazyReducers: Partial<RM> = {}
  const lazySagas: {
    [K in keyof S]?: Task|null
  } = {}

  function createReducer(): Reducer<S, A> {
    return combineReducers({
      ...staticReducers,
      ...lazyReducers,
    })
  }

  const {
    sagaMiddlewareOptions,
    middleware: configureStoreOptionsMiddleware,
    ...configureStoreOptions
  } = createLazyStoreOptions ?? {}
  const sagaMiddleware = createSagaMiddleware(sagaMiddlewareOptions)

  const store = configureStore({
    reducer   : createReducer(),
    middleware: options => {
      if (configureStoreOptionsMiddleware == null) {
        return [sagaMiddleware]
      }
      if (typeof configureStoreOptionsMiddleware === 'function') {
        return configureStoreOptionsMiddleware(options).concat(sagaMiddleware)
      }
      return configureStoreOptionsMiddleware.concat(sagaMiddleware)
    },
    ...configureStoreOptions,
  })

  sagaMiddleware.run(staticSaga)

  return injectModuleManager(store)
}
