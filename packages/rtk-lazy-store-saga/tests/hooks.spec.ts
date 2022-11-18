import { createUseLazyReducer } from '~/main.js'


test('no throw', () => {
  expect(() => {
    createUseLazyReducer()
  }).not.toThrow()
})
