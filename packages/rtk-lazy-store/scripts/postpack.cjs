const fs = require('fs')
const path = require('path')


fs.renameSync(path.join(__dirname, '../package.json'), path.join(__dirname, '../__package-post-pack__.json'))
try {
  fs.renameSync(path.join(__dirname, '../__package-pre-pack__.json'), path.join(__dirname, '../package.json'))
} catch (e) {
  fs.renameSync(path.join(__dirname, '../__package-post-pack__.json'), path.join(__dirname, '../package.json'))
  throw e
}
fs.unlinkSync(path.join(__dirname, '../__package-post-pack__.json'))
