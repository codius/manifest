const { addErrorMessage } = require('./common/add-error.js')

const validateContainers = function (manifest) {
  let errors = []
  const privateManifest = manifest['private']
  const containers = manifest['manifest']['containers']

  // Check if container ids are unique
  errors = errors.concat(checkIds(containers))

  // Validate environment of each container
  for (let i = 0; i < containers.length; i++) {
    const environment = manifest['manifest']['containers'][i]['environment']

    // Error check each environment key
    Object.keys(environment).map((varName) => {
      const varPath = `manifest.containers[${i}].environment.${varName}`

      // Check if env variable name begins with `CODIUS`
      if (varName.startsWith('CODIUS')) {
        addErrorMessage(
          errors, varPath,
          'environment variables starting in `CODIUS` are reserved.'
        )
      }

      // Check if env variable is defined within manifest.vars
      const publicVars = manifest['manifest']['vars']
      const varSpec = publicVars && publicVars[varName]
      if (!varSpec) {
        const envValue = environment[varName]
        if (!envValue.startsWith('$')) {
          return
        } else {
          // Environment variable must be defined within manifest.vars if the value
          // begins with `$`
          addErrorMessage(
            errors, varPath,
            'env variable is not defined within manifest.vars.'
          )
          return
        }
      }
      // Check if environment variable with encoding is defined within private manifest
      const privateVarSpec = privateManifest['vars'] && privateManifest['vars'][varName]
      if (varSpec.encoding === 'private:sha256') {
        if (!privateVarSpec) {
          addErrorMessage(
            errors, varPath,
            'encoded env variable is not defined within private manifest field'
          )
        }
      }
    })
  }
  return errors
}

const checkIds = function (containers) {
  const errors = []
  const ids = new Set()

  for (let i = 0; i < containers.length; i++) {
    ids.add(containers[i].id)
  }

  if (ids.size < containers.length) {
    addErrorMessage(errors, 'manifest.containers', 'container ids must be unique.')
  }

  return errors
}

module.exports = { validateContainers }
