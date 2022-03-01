Lazy Store for Redux w/ Toolkit (@whitetrefoil/rtk-lazy-store)
==========

This one is designed to be used **without** sagas.
To use it with sagas, try [`@whitetrefoil/rtk-lazy-store-saga`](https://github.com/whitetrefoil/rtk-lazy-store/tree/master/packages/rtk-lazy-store-saga).

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

Now we can create the store very similarly to the original way.
The only difference is that we pass-in the `staticReducerMap` instead of the original `reducer` separately.
The original `reducer` in the options is omitted.

```ts
import { createLazyStore } from '@whitetrefoil/rtk-lazy-store'

export function configureStore(preloadedState?: PreloadedState<RootState>) {
  const store = createLazyStore<RootState>(staticReducerMap, {
    preloadedState,
    devTools: true,
  })
  return store
}
```

### Using

Finally, we got the lazy-store, which is just an original `EnhancedStore` from RTK's `configureStore` function, with an extension of `moduleManager` property.

The `moduleManager` is an object with 2 methods: `enter` and `leave`.

* `store.moduleManager.enter(key, reducer)`
  * `key` is the name of the module, must be one of the optional keys in `RootState`;
  * `reducer` is the reducer for the module, which is actually optional;
* `store.moduleManager.leave(key, clean)`
  * `key` is the name of the module which to be removed;
  * `clean` is an optional boolean (default to false) means whether to remove the module's reducer / state from the store.

### Optional Steps

RTK suggests creating an `useAppDispatch` hook to replace the original `useDispatch` hook.
To achieve this:
```ts
export type AppDispatch = ReturnType<typeof configureStore>['dispatch']

export function useAppDispatch() {
  return useDispatch<AppDispatch>()
}
```

We also suggest creating an `useLazyStore` hook to help load/unload modules when entering/leaving features (works well with `useEffect`).
We provide a helper function to create that:
```ts
import { createUseLazyReducer } from '@whitetrefoil/rtk-lazy-store'

export const useLazyReducer = createUseLazyReducer<RootState>(
  /* explicitly pass-in `true` here if intent to clean the reducer when leaving, default is `false` */
)
```

Then in the feature component:
```ts
import { useLazyReducer } from '../hooks/use-lazy-reducer'
import { reducer } from './store/reducer'

const MyDynamicFeat = () => {
  useLazyReducer('aDynamicModule', reducer)
}
```
