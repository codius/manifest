const { addErrorMessage } = require('./common/add-error.js')

const validatePublicVars = function (manifest) {
  let errors = []
  const publicVars = manifest['manifest']['vars']

  // Check if public vars are not defined
  if (!publicVars) {
    return errors
  }

  // Check if all public vars are used within the environment
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

const checkUsage = function (containers, varName) {
  // Check if public var is used in a container
  for (let i = 0; i < containers.length; i++) {
    const envVars = containers[i]['environment']
    if (envVars[varName]) {
      return true
    }
  }
  return false
}

module.exports = { validatePublicVars }
