const codiusSchema = require('../schemas/CodiusSpec.json')
const varsSchema = require('../schemas/CodiusVarsSpec.json')
const debug = require('debug')('codius-manifest:generate-complete-manifest')
const fse = require('fs-extra')
const { hashPrivateVars } = require('./common/crypto-utils.js')
const jsen = require('jsen')

const generateCompleteManifest = async function (codiusVarsPath, codiusPath) {
  const codiusVars = await fse.readJson(codiusVarsPath)
  const codius = await fse.readJson(codiusPath)
  const validateCodiusFile = jsen(codiusSchema, { greedy: true })
  const validateCodiusVarsFile = jsen(varsSchema, { greedy: true })

  // Validate Codius file against schema
  debug(`validating Codius file at ${codiusPath}...`)
  validateCodiusFile(codius)
  const codiusSchemaErrors = validateCodiusFile.errors
  if (codiusSchemaErrors.length > 0) {
    throw new Error(`Invalid Codius file at ${codiusPath}
      errors: ${JSON.stringify(codiusSchemaErrors, null, 2)}`)
  }

  // Validate Codius vars against schema
  debug(`validating Codius vars file at ${codiusVarsPath}...`)
  validateCodiusVarsFile(codiusVars)
  const codiusVarsSchemaErrors = validateCodiusVarsFile.errors
  if (codiusVarsSchemaErrors.length > 0) {
    throw new Error(`Invalid Codius vars file at ${codiusVarsPath}
      errors: ${JSON.stringify(codiusVarsSchemaErrors, null, 2)}`)
  }

  // Generate a complete Codius manifest
  debug('generating compelete manifest...')
  const completeManifest = { manifest: codius['manifest'] }

  // Update public vars in the final manifest
  const publicVars = codiusVars['vars']['public']
  if (publicVars) {
    if (!completeManifest['manifest']['vars']) {
      completeManifest['manifest']['vars'] = publicVars
    }
    const publicVarKeys = Object.keys(publicVars)
    publicVarKeys.map((varName) => {
      completeManifest['manifest']['vars'][varName] = publicVars[varName]
    })
  }

  // Update private vars in the final manifest
  const privateVars = codiusVars['vars']['private']
  if (privateVars) {
    completeManifest['private'] = { vars: privateVars }
    const privateVarKeys = Object.keys(privateVars)
    privateVarKeys.map((varName) => {
      completeManifest['private']['vars'][varName] = privateVars[varName]
    })
    checkPrivateVarEncodings(completeManifest)
  }

  removeDescriptions(completeManifest) // remove description fields from manifest
  debug(`Complete Manifest: ${JSON.stringify(completeManifest, null, 2)}`)
  return completeManifest
}

const checkPrivateVarEncodings = function (completeManifest) {
  const publicVars = completeManifest['manifest']['vars']
  if (!publicVars) {
    completeManifest['manifest']['vars'] = {}
  }

  const privateVarHashes = hashPrivateVars(completeManifest)
  const privateVarKeys = Object.keys(privateVarHashes)
  privateVarKeys.map((varName) => {
    const encoding = {
      'encoding': 'private:sha256',
      'value': privateVarHashes[varName]
    }
    const publicEncoding = publicVars[varName]
    if (!publicEncoding) {
      debug(`Generating public encoding for ${varName}`)
      publicVars[varName] = encoding
      debug(`New encoding for ${varName}: ${JSON.stringify(publicEncoding, null, 2)}`)
    } else if (publicEncoding['encoding'] !== 'private:sha256' ||
        publicEncoding['value'] !== privateVarHashes[varName]) {
      debug(`Replacing invalid public encoding for ${varName}`)
      publicVars[varName] = encoding
      debug(`New encoding for ${varName}: ${JSON.stringify(publicEncoding, null, 2)}`)
    }
  })
  return completeManifest
}

const removeDescriptions = function (completeManifest) {
  // Remove description fields from a complete manifest
  const publicVars = completeManifest['manifest']['vars']
  if (publicVars) {
    const publicVarKeys = Object.keys(publicVars)
    publicVarKeys.map((varName) => {
      const publicVar = publicVars[varName]
      if (publicVar['description']) {
        delete publicVar['description']
      }
    })
  }
  return completeManifest
}
module.exports = {
  generateCompleteManifest
}
