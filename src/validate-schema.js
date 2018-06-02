const addErrorMessage = require('./common/add-error.js').addErrorMessage
const jsen = require('jsen')
const manifestSpec = require('../schemas/ManifestSpec.json')

const validateSchema = function (manifest) {
  const validate = jsen(manifestSpec)
  validate(manifest)
  return parseSchemaErrors(validate.errors)
}

const parseSchemaErrors = function (errorList) {
  let errors = []

  for (let i = 0; i < errorList.length; i++) {
    const error = errorList[i]
    const varName = parseVarPath(error['path'])
    const errorfmt = (JSON.stringify(error)).replace(/"/g, "'")
    addErrorMessage(errors, varName, `schema is invalid. errors=${JSON.stringify(errorfmt)}`)
  }
  return errors
}

const parseVarPath = function (path) {
  // Get variable name from object path
  const tokens = path.split('.')
  return tokens.slice(-1).pop()
}

exports.validateSchema = validateSchema
