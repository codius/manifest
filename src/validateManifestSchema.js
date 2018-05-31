const jsen = require('jsen')
const manifestSpec = require('../schemas/ManifestSpec.json')

const validateManifestSchema = function (manifest) {
  const validate = jsen(manifestSpec)
  validate(manifest)
  return validate.errors
}

exports.validateManifestSchema = validateManifestSchema
