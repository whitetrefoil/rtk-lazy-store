Lazy Store for Redux + Saga w/ Toolkit (@whitetrefoil/rtk-lazy-store-saga)
==========

This one is designed to be used **with** sagas.
If you don't use sagas, try [`@whitetrefoil/rtk-lazy-store`](https://github.com/whitetrefoil/rtk-lazy-store/tree/master/packages/rtk-lazy-store).

Usage
-----

### Preparation

Firstly, we need to define a `RootState`, the keys are module names, and are non-optional if static / optional if lazy.

```ts
export interface RootState {
  // required if static
  aStaticModule: import('./aStaticModule').State;
  // optional if lazy
  aDynamicModule?: import('./aDynamicModule').State;
}
```

Then we need to construct the static reducer map, it's a map of module names to reducers, very similar to what used in `combineReducers` function.
Be attentive to the key names of the reducers, they should be the same as the required parts of `RootState`.

```ts
import { reducer as aStaticModuleReducer } from './aStaticModule'

const staticReducerMap = {
  aStaticModule: aStaticModuleReducer,
}
```

We also need a static saga generator:
```ts
// This is just an pseudo-code example
function *staticSaga() {
  try {
    const combinedSagas = combineSagas([
      dynamicSaga,
    ])
    yield *combinedSagas()
  } finally {
    if ((yield cancelled()) as boolean) {
      // log something
    }
  }
}
```

Now we can create the store very similarly to the original way.

One of the differences is that we pass-in the `staticReducerMap` (instead of the original `reducer`) & `staticSaga` separately.
The original `reducer` in the options is omitted.

The other one is that we don't need to pass-in the `sagaMiddleware` anymore, instead a `sagaMiddlewareOptions` is accepted.

```ts
import { createLazyStore } from '@whitetrefoil/rtk-lazy-store-saga'

export function configureStore(preloadedState?: PreloadedState<RootState>) {
  const store = createLazyStore<RootState>(staticReducerMap, {
    preloadedState,
    sagaMiddlewareOptions: {
      onError(err, { sagaStack }) {
        console.error(err, sagaStack)
      },
    },
    devTools: true,
  })
  return store
}
```

### Using

Finally, we got the lazy-store, which is just an original `EnhancedStore` from RTK's `configureStore` function, with an extension of `moduleManager` property.

The `moduleManager` is an object with 2 methods: `enter` and `leave`.

* `store.moduleManager.enter(key, reducer, saga)`
  * `key` is the name of the module, must be one of the optional keys in `RootState`;
  * `reducer` is the reducer for the module, which is actually optional;
  * `saga` is the lazy saga for the module, which is also optional (**ATTENTION**: the module saga will be run separately from the static saga).
* `store.moduleManager.leave(key, clean)`
  * `key` is the name of the module which to be removed;
  * `clean` is an optional boolean (default to false) means whether to remove the module's reducer / state from the store (**ATTENTION**: the saga will always be cancelled).

### Optional Steps

RTK suggests creating an `useAppDispatch` hook to replace the original `useDispatch` hook.
To achieve this:
```ts
export type AppDispatch = ReturnType<typeof configureStore>['dispatch']

export function useAppDispatch() {
  return useDispatch<AppDispatch>()
}
```

We also suggest creating an `useLazyStore` hook to help load / unload modules when entering / leaving features (using `useEffect`).
We provide a helper function to create that:
```ts
import { createUseLazyReducer } from '@whitetrefoil/rtk-lazy-store-saga'

export const useLazyReducer = createUseLazyReducer<RootState>(
  /* explicitly pass-in `true` here if intent to clean the reducer when leaving, default is `false` */
)
```

Then in the feature component:
```ts
import { useLazyReducer } from '../hooks/use-lazy-reducer'
import { reducer } from './store/reducer'
import { saga } from './store/saga'

const MyDynamicFeat = () => {
  useLazyReducer('aDynamicModule', reducer, saga)
}
```
