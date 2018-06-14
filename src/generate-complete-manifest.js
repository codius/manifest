const manifestSchema = require('../schemas/CodiusManifestSpec.json')
const varsSchema = require('../schemas/CodiusVarsSpec.json')
const debug = require('debug')('codius-manifest:generate-complete-manifest')
const fse = require('fs-extra')
const { hashPrivateVars } = require('./common/crypto-utils.js')
const jsen = require('jsen')

const generateCompleteManifest = async function (codiusVars, codiusManifest) {
  const vars = await fse.readJson(codiusVars)
  const manifest = await fse.readJson(codiusManifest)
  const validateManifest = jsen(manifestSchema, { greedy: true })
  const validateVars = jsen(varsSchema, { greedy: true })

  // Validate Codius manifest against schema
  debug(`validating Codius manifest at ${codiusManifest}`)
  validateManifest(manifest)
  const manifestSchemaErrors = validateManifest.errors
  if (manifestSchemaErrors.length > 0) {
    throw new Error(`Invalid Codius Manifest Spec at ${codiusManifest}
      errors: ${JSON.stringify(manifestSchemaErrors, null, 2)}`)
  }

  // Validate Codius vars against schema
  debug(`validating Codius vars at ${codiusVars}`)
  validateVars(vars)
  const varsSchemaErrors = validateVars.errors
  if (varsSchemaErrors.length > 0) {
    throw new Error(`Invalid Codius Vars Spec at ${codiusVars}
      errors: ${JSON.stringify(varsSchemaErrors, null, 2)}`)
  }

  // Generate complete manifest from Codius
  debug('generating compelete manifest...')
  const completeManifest = { manifest: manifest['manifest'] }

  // Update public vars in final manifest
  const publicVars = vars['vars']['public']
  if (publicVars) {
    if (!completeManifest['manifest']['vars']) {
      completeManifest['manifest']['vars'] = publicVars
    }
    const publicVarKeys = Object.keys(publicVars)
    publicVarKeys.map((varName) => {
      completeManifest['manifest']['vars'][varName] = publicVars[varName]
    })
  }

  // Update private vars in final manifest
  const privateVars = vars['vars']['private']
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

const checkPrivateVarEncodings = function (manifest) {
  const publicVars = manifest['manifest']['vars']
  if (!publicVars) {
    manifest['manifest']['vars'] = {}
  }

  const privateVarHashes = hashPrivateVars(manifest)
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
  return manifest
}

const removeDescriptions = function (manifest) {
  // Remove description fields from a manifest
  const publicVars = manifest['manifest']['vars']
  if (publicVars) {
    const publicVarKeys = Object.keys(publicVars)
    publicVarKeys.map((varName) => {
      const publicVar = publicVars[varName]
      if (publicVar['description']) {
        delete publicVar['description']
      }
    })
  }
  return manifest
}
module.exports = {
  generateCompleteManifest
}
