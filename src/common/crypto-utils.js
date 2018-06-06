const canonicalJson = require('canonical-json')
const { createHash, randomBytes } = require('crypto')
const { encode } = require('../common/base32.js')

const generateNonce = function () {
  // Generates 16 byte nonce
  const buf = randomBytes(16)
  return buf.toString('hex')
}

const hashPrivateVars = function (manifest) {
  const privateVars = manifest['private']['vars']
  const privateVarHashes = {}

  Object.keys(privateVars).map((key) => {
    privateVarHashes[key] = createHash('sha256')
      .update(canonicalJson(privateVars[key]))
      .digest('hex')
    return key
  })
  return privateVarHashes
}

const hashManifest = function (manifest) {
  const hashed = createHash('sha256')
    .update(canonicalJson(manifest), 'utf8')
    .digest()

  return encode(hashed)
}

module.exports = {
  generateNonce,
  hashManifest,
  hashPrivateVars
}
