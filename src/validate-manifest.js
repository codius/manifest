const addErrorMessage = require('./common/add-error.js').addErrorMessage
const validateContainers = require('./validate-containers.js').validateContainers
const validateSchema = require('./validate-schema.js').validateSchema

const validateManifest = function (manifest) {
  let errors = []
  const publicVars = manifest['manifest']['vars']

  // Check if public vars are not defined
  if (!publicVars) {
    addErrorMessage(errors, 'manifest.vars', 'public vars are not defined. ' +
      'var=manifest.var')
    return errors
  }

  return errors.concat(validateContainers(manifest), validateSchema(manifest))
}

exports.validateManifest = validateManifest
