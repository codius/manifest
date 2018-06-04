const addErrorMessage = require('./common/add-error.js').addErrorMessage
const hashPrivateVars = require('./common/crypto-utils.js').hashPrivateVars
const checkUsage = require('./common/check-usage.js').checkUsage

// Check hash of a single private variables
const validatePrivateVars = function (manifest) {
  let errors = []
  const publicVars = manifest['manifest']['vars']

  // Check if public vars are defined
  if (!publicVars) {
    addErrorMessage(errors, 'manfiest.private', 'cannot validate private vars' +
      ` - public vars are not defined.`)
    return errors
  }

  const privateVarHashes = hashPrivateVars(manifest)
  const privateVarKeys = Object.keys(manifest['private']['vars'])

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
    const containers = manifest['manifest']['containers']
    const isUsed = checkUsage(containers, varName)
    if (!isUsed) {
      addErrorMessage(errors, varName, 'private var is never used within containers ' +
        `var=${varName}`)
    }
  })
  return errors
}

exports.validatePrivateVars = validatePrivateVars
