const validatePublicVars = require('./validate-public-vars.js').validatePublicVars
const validatePrivateVars = require('./validate-private-vars.js').validatePrivateVars
const validateContainers = require('./validate-containers.js').validateContainers
const validateSchema = require('./validate-schema.js').validateSchema

const validateManifest = function (manifest) {
  let errors = []

  return errors.concat(
    validateContainers(manifest),
    validateSchema(manifest),
    validatePublicVars(manifest),
    validatePrivateVars(manifest)
  )
}

exports.validateManifest = validateManifest
