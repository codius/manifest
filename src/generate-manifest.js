const codiusSchema = require('../schemas/CodiusSpec.json')
const varsSchema = require('../schemas/CodiusVarsSpec.json')
const debug = require('debug')('codius-manifest:generate-manifest')
const fse = require('fs-extra')
const { hashPrivateVars } = require('./common/crypto-utils.js')
const jsen = require('jsen')

const generateManifest = async function (codiusVarsPath, codiusPath) {
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
  const generatedManifest = { manifest: codius['manifest'] }

  // Update public vars in the final manifest
  const publicVars = codiusVars['vars']['public']
  if (publicVars) {
    if (!generatedManifest['manifest']['vars']) {
      generatedManifest['manifest']['vars'] = publicVars
    }
    const publicVarKeys = Object.keys(publicVars)
    publicVarKeys.map((varName) => {
      generatedManifest['manifest']['vars'][varName] = publicVars[varName]
    })
  }

  // Update private vars in the final manifest
  const privateVars = codiusVars['vars']['private']
  if (privateVars) {
    generatedManifest['private'] = { vars: privateVars }
    const privateVarKeys = Object.keys(privateVars)
    privateVarKeys.map((varName) => {
      generatedManifest['private']['vars'][varName] = privateVars[varName]
    })
    addPrivateVarEncodings(generatedManifest)
  }

  removeDescriptions(generatedManifest) // remove description fields from manifest
  debug(`Complete Manifest: ${JSON.stringify(generatedManifest, null, 2)}`)
  return generatedManifest
}

const addPrivateVarEncodings = function (generatedManifest) {
  const publicVars = generatedManifest['manifest']['vars']
  if (!publicVars) {
    generatedManifest['manifest']['vars'] = {}
  }
  const privateVarHashes = hashPrivateVars(generatedManifest)
  const privateVarKeys = Object.keys(privateVarHashes)
  privateVarKeys.map((varName) => {
    const encoding = {
      'encoding': 'private:sha256',
      'value': privateVarHashes[varName]
    }
    debug(`Generating public encoding for ${varName}`)
    publicVars[varName] = encoding
    debug(`New encoding for ${varName}: ${JSON.stringify(encoding, null, 2)}`)
  })
  return generatedManifest
}

const removeDescriptions = function (generatedManifest) {
  // Remove description fields from a generated manifest
  const publicVars = generatedManifest['manifest']['vars']
  if (publicVars) {
    const publicVarKeys = Object.keys(publicVars)
    publicVarKeys.map((varName) => {
      const publicVar = publicVars[varName]
      if (publicVar['description']) {
        delete publicVar['description']
      }
    })
  }
  return generatedManifest
}
module.exports = {
  generateManifest
}
