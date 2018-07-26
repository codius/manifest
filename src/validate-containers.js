const { addErrorMessage } = require('./common/add-error.js')
const debug = require('debug')('codius-manifest:validate-containers')

const validateContainers = function (manifest) {
  let errors = []
  const privateManifest = manifest['private']
  const containers = manifest['manifest']['containers']

  // Check if container ids are unique
  errors = errors.concat(checkIds(containers))

  debug('validating containers...')
  containers.forEach((container, i) => {
    const environment = container['environment'] || {}
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

      // Environment variable must be defined within manifest.vars if the value
      // begins with `$`
      if (!publicVars[envValue]) {
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
      if (!encoding) {
        return
      }
      if (encoding === 'private:sha256') {
        if (!privateVarSpec) {
          addErrorMessage(
            errors, varPath,
            'encoded env variable is not defined within private manifest field'
          )
        }
      } else {
        // Add error if encoding id is defined but not equal to private:sha256
        addErrorMessage(
          errors, `manifest.vars.${envValue}`, 'invalid encoding'
        )
      }
    })
  })
  debug(`container validation errors: ${JSON.stringify(errors, null, 2)}`)
  return errors
}

const checkIds = function (containers) {
  // Check for duplicate container ids
  const errors = []
  const ids = new Set()

  for (const container of containers) {
    ids.add(container.id)
  }

  if (ids.size < containers.length) {
    addErrorMessage(errors, 'manifest.containers', 'container ids must be unique.')
  }
  return errors
}

module.exports = { validateContainers }
