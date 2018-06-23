const { addErrorMessage } = require('./common/add-error.js')
const debug = require('debug')('codius-manifest:validate-containers')

const validateContainers = function (manifest) {
  let errors = []
  const privateManifest = manifest['private']
  const containers = manifest['manifest']['containers']

  // Check if container ids are unique
  errors = errors.concat(checkIds(containers))
  debug('validating containers...')
  // Validate environment of each container
  for (let i = 0; i < containers.length; i++) {
    const environment = manifest['manifest']['containers'][i]['environment']
    debug(`environment: ${JSON.stringify(environment, null, 2)}`)
    // Error check each environment key
    const environmentKeys = Object.keys(environment)
    environmentKeys.map((varName) => {
      const varPath = `manifest.containers[${i}].environment.${varName}`

      // Check if env variable name begins with `CODIUS`
      if (varName.startsWith('CODIUS')) {
        addErrorMessage(
          errors, varPath,
          'environment variables starting in `CODIUS` are reserved.'
        )
      }

      // Skip additional validation steps for environment variables set to literals
      let envValue = environment[varName]
      if (!envValue.startsWith('$')) {
        return
      }

      // Check if public vars are defined
      const publicVars = manifest['manifest']['vars']
      if (!publicVars) {
        addErrorMessage(
          errors, `${varPath}`,
          'cannot validate env variable - manifest.vars not defined'
        )
        return
      }

      envValue = envValue.substring(1) // remove $ from env value

      // Check env variable is specified in manfiest.vars
      if (!publicVars[envValue]) {
        // Environment variable must be defined within manifest.vars if the value
        // begins with `$`
        addErrorMessage(
          errors, varPath,
          'env variable is not defined within manifest.vars.'
        )
        return
      }

      // Check if private manifest is defined
      if (!privateManifest) {
        return
      }

      // Check if environment variable with encoding is defined within private manifest
      const encoding = publicVars[envValue]['encoding']
      const privateVarSpec = privateManifest['vars'] && privateManifest['vars'][envValue]
      if (encoding === 'private:sha256') {
        if (!privateVarSpec) {
          addErrorMessage(
            errors, varPath,
            'encoded env variable is not defined within private manifest field'
          )
        }
      } else if (encoding) {
        // Add error if encoding id is defined but not equal to private:sha256
        addErrorMessage(errors, `manifest.vars.${envValue}`, 'invalid encoding')
      }
    })
  }
  debug(`container validation errors: ${JSON.stringify(errors, null, 2)}`)
  return errors
}

const checkIds = function (containers) {
  // Check for duplicate container ids
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
