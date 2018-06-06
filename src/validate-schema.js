const addErrorMessage = require('./common/add-error.js').addErrorMessage
const jsen = require('jsen')
const manifestSpec = require('../schemas/ManifestSpec.json')

const validateSchema = function (manifest) {
  const validate = jsen(manifestSpec, { greedy: true })
  validate(manifest)
  return parseSchemaErrors(validate.errors)
}

const parseSchemaErrors = function (errorList) {
  let errors = []

  for (let i = 0; i < errorList.length; i++) {
    const error = errorList[i]
    let errorfmt = (JSON.stringify(error)).replace(/"/g, "'")

    addErrorMessage(errors, error['path'], `schema is invalid. error=${errorfmt}`)
  }
  return errors
}

exports.validateSchema = validateSchema
