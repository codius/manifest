const crypto = require('crypto')
const canonicalJson = require('canonical-json')

const generateNonce = function () {
  // Generates 16 byte nonce
  const buf = crypto.randomBytes(16)
  return buf.toString('base64')
}

const hashPrivateManifestVars = function (manifest) {
  const privateVars = manifest['private']['vars']

  return Object.keys(privateVars).map((key) => {
    return crypto.createHash('sha256')
      .update(canonicalJson(privateVars[key]))
      .digest('base64')
  })
}

exports.generateNonce = generateNonce
exports.hashPrivateManifestVars = hashPrivateManifestVars
