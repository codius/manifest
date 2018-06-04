const { validatePublicVars } = require('./validate-public-vars.js')
const { validatePrivateVars } = require('./validate-private-vars.js')
const { validateContainers } = require('./validate-containers.js')
const { validateSchema } = require('./validate-schema.js')

const validateManifest = function (manifest) {
  let errors = []

  return errors.concat(
    validateContainers(manifest),
    validateSchema(manifest),
    validatePublicVars(manifest),
    validatePrivateVars(manifest)
  )
}

module.exports = { validateManifest }
