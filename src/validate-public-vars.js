const addErrorMessage = require('./common/add-error.js').addErrorMessage
const checkUsage = require('./common/check-usage.js').checkUsage

const validatePublicVars = function (manifest) {
  let errors = []
  const publicVars = manifest['manifest']['vars']

  // Check if public vars are not defined
  if (!publicVars) {
    addErrorMessage(errors, 'manifest.vars', 'public vars are not defined. ' +
      'var=manifest.var')
    return errors
  }

  // Check if public variable is used within environment
  Object.keys(publicVars).map((varName) => {
    const containers = manifest['manifest']['containers']
    const isUsed = checkUsage(containers, varName)
    if (!isUsed) {
      addErrorMessage(errors, varName, 'public var defined but never used in ' +
      `a container environment. var=${varName}`)
    }
  })

  return errors
}

exports.validatePublicVars = validatePublicVars
