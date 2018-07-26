const debug = require('debug')('codius-manifest:validate-generated-manifest')
const { validatePublicVars } = require('./validate-public-vars.js')
const { validatePrivateVars } = require('./validate-private-vars.js')
const { validateContainers } = require('./validate-containers.js')
const { validateSchema } = require('./validate-schema.js')

const validateGeneratedManifest = function (manifest) {
  let errors = []
  debug('validating generated manifest...')
  const schemaErrors = validateSchema(manifest)

  // Return early if schema errors occur
  if (schemaErrors.length) {
    debug(`validation failed due to the following schema errors:
      ${JSON.stringify(errors, null, 2)}`)
    return schemaErrors
  }

  const containerErrors = validateContainers(manifest)
  const publicVarErrors = validatePublicVars(manifest)
  const privateVarErrors = validatePrivateVars(manifest)
  errors = [
    ...containerErrors,
    ...publicVarErrors,
    ...privateVarErrors
  ]
  debug(`manifest errors: ${JSON.stringify(errors, null, 2)}`)
  return errors
}

module.exports = { validateGeneratedManifest }
