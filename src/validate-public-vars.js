const { addErrorMessage } = require('./common/add-error.js')
const { checkUsage } = require('./common/check-usage.js')
const debug = require('debug')('codius-manifest:validate-publicvars')

const validatePublicVars = function (manifest) {
  let errors = []
  const publicVars = manifest['manifest']['vars']

  // Check if public vars are not defined
  if (!publicVars) {
    return errors
  }
  debug('validating public variables...')
  // Check if all public vars are used within the environment
  const publicVarKeys = Object.keys(publicVars)
  publicVarKeys.map((varName) => {
    const isUsed = checkUsage(manifest, varName)
    if (!isUsed) {
      addErrorMessage(
        errors, `manifest.vars.${varName}`,
        'public var is not used within a container'
      )
    }
  })
  debug('public variable errors:')
  debug(errors)

  return errors
}

module.exports = { validatePublicVars }
