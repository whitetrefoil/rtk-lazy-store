const fs = require('fs')
const path = require('path')


/**
 * @returns {string|null}
 */
function getReadme() {
  try {
    return fs.readFileSync(path.join(__dirname, '../README.md'), 'utf8')
  } catch (e) {
    // ignore
  }

  try {
    return fs.readFileSync(path.join(__dirname, '../README.txt'), 'utf8')
  } catch (e) {
    // ignore
  }

  try {
    return fs.readFileSync(path.join(__dirname, '../README'), 'utf8')
  } catch (e) {
    // ignore
  }

  return null
}

/** @type string|null */
const readme = getReadme()

if (readme == null) {
  console.warn('No README found')
  return
}


const packageJson = fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8')

const packageJsonObject = JSON.parse(packageJson)

if (packageJsonObject.readme != null) {
  return
}

packageJsonObject.readme = readme

fs.renameSync(path.join(__dirname, '../package.json'), path.join(__dirname, '../__package-pre-pack__.json'))

try {
  fs.writeFileSync(path.join(__dirname, '../package.json'), JSON.stringify(packageJsonObject, null, 2))
} catch (e) {
  fs.renameSync(path.join(__dirname, '../__package-pre-pack__.json'), path.join(__dirname, '../package.json'))
  throw e
}

