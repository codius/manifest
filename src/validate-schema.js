const addErrorMessage = require('./common/add-error.js').addErrorMessage
const debug = require('debug')('codius-manifest:validate-schema')
const jsen = require('jsen')
const generatedManifestSpec = require('../schemas/GeneratedManifestSpec.json')

const validateSchema = function (manifest) {
  debug('validating manifest schema...')
  const validate = jsen(generatedManifestSpec, { greedy: true })
  validate(manifest)
  const errors = parseSchemaErrors(validate.errors)
  debug(`schema errors: ${JSON.stringify(errors, null, 2)}`)
  return errors
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
