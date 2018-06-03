const addErrorMessage = require('./common/add-error.js').addErrorMessage

const validateContainers = function (manifest) {
  let errors = []
  const privateManifest = manifest['private']
  const containers = manifest['manifest']['containers']

  // Validate environment of each container
  for (let i = 0; i < containers.length; i++) {
    const environment = manifest['manifest']['containers'][i]['environment']
    Object.keys(environment).map((varName) => {
      // Check if env variable name begins with `CODIUS`
      if (varName.startsWith('CODIUS')) {
        addErrorMessage(errors, varName, 'environment variables starting in ' +
          '"CODIUS" are reserved. ' +
          `var=${varName}`)
      }

      // Check if env variable is defined within manifest vars
      const varSpec = manifest['manifest']['vars'] && manifest['manifest']['vars'][varName]
      if (!varSpec) {
        addErrorMessage(errors, varName, 'env variable is not defined within manifest vars. ' +
          `var=${varName}`)
        return errors
      }

      // Check if environment variable with encoding is defined within private manifest
      const privateVarSpec = privateManifest['vars'] && privateManifest['vars'][varName]
      if (varSpec.encoding === 'private:sha256') {
        if (!privateVarSpec) {
          addErrorMessage(errors, varName, 'encoded env variable not defined within private manifest' +
            `var=${varName}`)
        }
      }
    })
  }
  return errors
}

exports.validateContainers = validateContainers
