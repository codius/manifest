// Index.js for Codius Manifest module
const { validateManifest } = require('./src/validate-manifest.js')
const cryptoUtils = require('./src/common/crypto-utils.js')

module.exports = {
  validateManifest,
  generateNonce: cryptoUtils.generateNonce,
  hashManifest: cryptoUtils.hashManifest,
  hashPrivateVars: cryptoUtils.hashPrivateVars
}
