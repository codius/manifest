const { addErrorMessage } = require('./common/add-error.js')
const { checkUsage } = require('./common/check-usage.js')
const debug = require('debug')('codius-manifest:validate-publicvars')

const validatePublicVars = function (manifest) {
  let errors = []
  debug('validating public variables...')
  const publicVars = manifest['manifest']['vars']

  // Check if public vars are not defined
  if (!publicVars) {
    return errors
  }
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

    const encoding = manifest['manifest']['vars'][varName]['encoding']
    const privateVars = manifest['private']

    if (encoding && !privateVars) {
      addErrorMessage(
        errors, `manifest.vars.${varName}`,
        'public var has encoding but private.vars is undefined'
      )
    }
  })
  debug(`public variable errors: ${JSON.stringify(errors, null, 2)}`)
  return errors
}

module.exports = { validatePublicVars }
