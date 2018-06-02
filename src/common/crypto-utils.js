const crypto = require('crypto')
const canonicalJson = require('canonical-json')

const generateNonce = function () {
  // Generates 16 byte nonce
  const buf = crypto.randomBytes(16)
  return buf.toString('hex')
}

const hashPrivateVars = function (manifest) {
  const privateVars = manifest['private']['vars']
  const privateVarHashes = {}

  Object.keys(privateVars).map((key) => {
    privateVarHashes[key] = crypto.createHash('sha256')
      .update(canonicalJson(privateVars[key]))
      .digest('hex')
    return key
  })
  return privateVarHashes
}

exports.generateNonce = generateNonce
exports.hashPrivateVars = hashPrivateVars
