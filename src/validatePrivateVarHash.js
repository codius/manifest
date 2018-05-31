const { createHash } = require('crypto')
const Boom = require('boom')
const canonicalJson = require('canonical-json')

const validatePrivateVarHash = function (manifest) {
  const environment = manifest['manifest']['containers'][0]['environment']

  if (!environment) return []

  Object.keys(environment).map((key) => {
    validateEnvVar(environment[key], manifest)
  }
  )
}

const validateEnvVar = function (value, manifest) {
  // TODO: Check for private variables that are not defined within env field
  // TODO: is this the way we want to do escaping?
  if (value.startsWith('\\$')) return value.substring(1)
  if (!value.startsWith('$')) return value

  const publicManifest = manifest['manifest']
  const varName = value.substring(1)
  const varSpec = publicManifest['vars'] && publicManifest['vars'][varName]
  const privateManifest = manifest['private']
  const privateVarSpec = privateManifest['vars'] &&
    privateManifest['vars'][varName]

  if (!varSpec) {
    throw Boom.badData('could not interpolate var. ' +
        `var=${value} ` +
        `manifest.vars=${JSON.stringify(publicManifest['vars'])}`)
  }

  if (!varSpec.encoding) {
    return varSpec.value
  }

  if (varSpec.encoding === 'private:sha256') {
    if (!privateVarSpec) {
      throw Boom.badData('could not interpolate private var. ' +
          `var=${value} ` +
          `manifest.vars=${JSON.stringify(publicManifest['vars'])}`)
    }

    // TODO: change to base64??
    const hashPrivateVar = createHash('sha256')
      .update(canonicalJson(privateVarSpec))
      .digest('hex')

    if (hashPrivateVar !== varSpec.value) {
      throw Boom.badData('private var does not match hash. ' +
          `var=${value} ` +
          `encoding=${varSpec.encoding} ` +
          `public-hash=${varSpec.value} ` +
          `hashed-value=${hashPrivateVar}`)
    }
    return privateVarSpec.value
  }

  throw Boom.badData('unknown var encoding. var=' + JSON.stringify(varSpec))
}

exports.validatePrivateVarHash = validatePrivateVarHash
