const { validatePublicVars } = require('./validate-public-vars.js')
const { validatePrivateVars } = require('./validate-private-vars.js')
const { validateContainers } = require('./validate-containers.js')
const { validateSchema } = require('./validate-schema.js')

const validateGeneratedManifest = function (manifest) {
  let errors = []
  const schemaErrors = validateSchema(manifest)

  // Return early if schema errors occur
  if (schemaErrors.length) {
    return schemaErrors
  }

  return errors.concat(
    validateContainers(manifest),
    validatePublicVars(manifest),
    validatePrivateVars(manifest)
  )
}

module.exports = { validateGeneratedManifest }
