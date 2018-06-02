const addErrorMessage = require('./common/add-error.js').addErrorMessage

const validatePublicVars = function (manifest, containerId) {
  let errors = []
  const publicVars = manifest['manifest']['vars']
  const envVars = manifest['manifest']['containers'][containerId]['environment']

  // Check if public variable is used within environment
  Object.keys(publicVars).map((varName) => {
    if (!envVars[varName]) {
      addErrorMessage(errors, varName, 'public variable defined but ' +
      'never used in environment. ' + `var=${varName}`)
    }
  })

  return errors
}

exports.validatePublicVars = validatePublicVars
