const addErrorMessage = require('./common/add-error.js').addErrorMessage
const hashPrivateVars = require('./common/crypto-utils.js').hashPrivateVars

// Check hash of a single private variables
const validatePrivateVars = function (manifest, containerId) {
  let errors = []
  const privateVarHashes = hashPrivateVars(manifest)
  const publicVars = manifest['manifest']['vars']
  const privateVarKeys = Object.keys(manifest['private']['vars'])
  const envVars = manifest['manifest']['containers'][containerId]['environment']

  // Check if the private variable hashes are consistent
  privateVarKeys.map((varName) => {
    const privateHash = privateVarHashes[varName]
    const publicHash = publicVars[varName]['value']
    if (publicHash !== privateHash) {
      addErrorMessage(errors, varName, 'private var hash does not match hashed value. ' +
          `var=${varName} ` +
          `public-hash=${publicHash} ` +
          `hashed-value=${privateHash}`)
    }

    // Check if private variable is defined within container
    if (!envVars[varName]) {
      addErrorMessage(errors, varName, 'private var is never used within containers ' +
        `var=${varName}`)
    }
  })
  return errors
}

exports.validatePrivateVars = validatePrivateVars
