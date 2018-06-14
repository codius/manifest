// Index.js for Codius Manifest module
const { validateManifest } = require('./src/validate-manifest.js')
const cryptoUtils = require('./src/common/crypto-utils.js')
const { generateCompleteManifest } = require('./src/generate-complete-manifest.js')
module.exports = {
  validateManifest,
  generateCompleteManifest,
  generateNonce: cryptoUtils.generateNonce,
  hashManifest: cryptoUtils.hashManifest,
  hashPrivateVars: cryptoUtils.hashPrivateVars
}
