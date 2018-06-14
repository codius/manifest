// Index.js for Codius Manifest module
const { validateCompleteManifest } = require('./src/validate-complete-manifest.js')
const cryptoUtils = require('./src/common/crypto-utils.js')
const { generateCompleteManifest } = require('./src/generate-complete-manifest.js')
module.exports = {
  validateCompleteManifest,
  generateCompleteManifest,
  hashManifest: cryptoUtils.hashManifest
}
