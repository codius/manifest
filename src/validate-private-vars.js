const { addErrorMessage } = require('./common/add-error.js')
const { hashPrivateVars } = require('./common/crypto-utils.js')
const { checkUsage } = require('./common/check-usage.js')
const debug = require('debug')('codius-manifest:validate-privatevars')

const validatePrivateVars = function (manifest) {
  let errors = []
  const publicVars = manifest['manifest']['vars']

  // Check if private vars are not defined
  if (!manifest['private']) {
    return errors
  }
  debug('validating private variables...')
  // Check if public vars are defined
  if (!publicVars) {
    addErrorMessage(errors, 'private', 'cannot validate private vars' +
      ` - manifest.vars is not defined.`)
    return errors
  }

  const privateVarHashes = hashPrivateVars(manifest)
  const privateVarKeys = Object.keys(manifest['private']['vars'])

  // Check if all private vars have consistent hashes and are used in an env
  privateVarKeys.map((varName) => {
    const privateHash = privateVarHashes[varName]
    // Return error if the corresponding public var is defined
    if (!publicVars[varName]) {
      addErrorMessage(
        errors, `private.${varName}`,
        'private var is not specified within manifest.vars'
      )
      return
    }

    // Check if public value is consistent with private hash
    const publicHash = publicVars[varName]['value']
    if (publicHash !== privateHash) {
      addErrorMessage(
        errors, `private.${varName}`,
        'private var hash does not match the hashed value. ' +
        `public-hash=${publicHash} ` +
        `hashed-value=${privateHash}`
      )
    }

    // Check if the private variable is used within a container environment
    const isUsed = checkUsage(manifest, varName)
    if (!isUsed) {
      addErrorMessage(
        errors, `private.${varName}`,
        'private var is never used within a container'
      )
    }
  })
  debug(`private variable errors: ${JSON.stringify(errors)}`)
  return errors
}

module.exports = { validatePrivateVars }
