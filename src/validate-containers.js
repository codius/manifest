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
      const varSpec = manifest['manifest']['vars'] && manifest['manifest']['vars'][varName]
      if (!varSpec) {
        addErrorMessage(
          errors, varPath,
          'env variable is not defined within manifest.vars.'
        )

        return
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

      // Check for variable in public vars
      if (environment[varName].startsWith('$')) {
        const value = environment[varName].substring(1)
        if (!publicVars[value]) {
          addErrorMessage(
            errors, varPath,
            `environment var is not properly defined. ${varName} !== ${value.substring(1)}`
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
