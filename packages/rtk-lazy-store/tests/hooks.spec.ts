import { createUseLazyReducer } from '~/main'


test('no throw', () => {
  expect(() => {
    createUseLazyReducer()
  }).not.toThrow()
})
