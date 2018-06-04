const { addErrorMessage } = require('./common/add-error.js')
const { hashPrivateVars } = require('./common/crypto-utils.js')

const validatePrivateVars = function (manifest) {
  let errors = []
  const publicVars = manifest['manifest']['vars']

  // Check if public vars are defined
  if (!publicVars) {
    addErrorMessage(errors, 'manfiest.private', 'cannot validate private vars' +
      ` - manifest.vars is not defined.`)
    return errors
  }

  const privateVarHashes = hashPrivateVars(manifest)
  const privateVarKeys = Object.keys(manifest['private']['vars'])

  // Check if the private variable hashes are consistent
  privateVarKeys.map((varName) => {
    const privateHash = privateVarHashes[varName]

    // Return error if the corresponding public var is defined
    if (!publicVars[varName]) {
      addErrorMessage(
        errors, varName,
        'private var is not specified within manifest.vars'
      )
    }

    // Check if public value is consistent with private hash
    const publicHash = publicVars[varName]['value']
    if (publicHash !== privateHash) {
      addErrorMessage(
        errors, varName,
        'private var hash does not match the hashed value. ' +
        `var=${varName} ` +
        `public-hash=${publicHash} ` +
        `hashed-value=${privateHash}`
      )
    }

    // Check if private variable is properly defined within container env
    const containers = manifest['manifest']['containers']
    errors = errors.concat(checkUsage(containers, varName))
  })
  return errors
}

const checkUsage = function (containers, varName) {
  let isUsed = false // is var used in a container
  let errors = []

  // Check if private variable is properly used in a container
  for (let i = 0; i < containers.length; i++) {
    const envVars = containers[i]['environment']
    const value = envVars[varName]

    // Check if private variable is defined in the container
    if (value) {
      isUsed = true

      // Check if variable is prefixed with `$` in env definition
      if (value.startsWith('$')) {
        if (!(value.substring(1) === varName)) {
          addErrorMessage(
            errors, `manifest.containers[${i}].environment.${varName}`,
            `environment var is not properly defined. ${varName} !== ${value.substring(1)}`
          )
        }
      } else {
        addErrorMessage(
          errors, `manifest.containers[${i}].environment.${varName}`,
          'environment var is not properly defined. value must begin with `$`'
        )
      }
    }
  }

  // Add error if private variable is never used in a container env
  if (!isUsed) {
    addErrorMessage(
      errors, `manifest.private.${varName}`,
      'private var is never used within containers'
    )
  }

  return errors
}

module.exports = { validatePrivateVars }
