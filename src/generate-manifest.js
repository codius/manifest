const codiusSchema = require('../schemas/CodiusSpec.json')
const varsSchema = require('../schemas/CodiusVarsSpec.json')
const debug = require('debug')('codius-manifest:generate-manifest')
const fse = require('fs-extra')
const cryptoUtils = require('./common/crypto-utils.js')
const jsen = require('jsen')
const { validateGeneratedManifest } = require('./validate-generated-manifest.js')
// const drc = require('docker-registry-client')

const generateManifest = async function (codiusVarsPath, codiusPath) {
  const codiusVars = await fse.readJson(codiusVarsPath)
  const codius = await fse.readJson(codiusPath)

  // Validate codius file against schema
  debug(`validating Codius file at ${codiusPath}...`)
  validateCodiusFileSchema(codius, codiusPath)

  // Validate codiusvars file against schema
  debug(`validating Codius vars file at ${codiusVarsPath}...`)
  validateCodiusVarsFileSchema(codiusVars, codiusVarsPath)

  // Generate a complete Codius manifest
  debug('generating compelete manifest...')
  const generatedManifest = { manifest: codius['manifest'] }
  processPublicVars(generatedManifest, codiusVars)
  processPrivateVars(generatedManifest, codiusVars)
  removeDescriptions(generatedManifest)

  // Validate generated manifest
  debug('validating generated manifest...')
  validateFinalManifest(generatedManifest)

  // Automatically add an empty private vars field to the final manifest.
  // Codiusd will reject contract uploads that have public
  // vars defined but no private manifest field, although the latter is optional
  // See codiusd issue #75: https://github.com/codius/codiusd/issues/75
  const publicVars = generatedManifest['manifest']['vars']
  const privateVars = generatedManifest['private']
  if (publicVars && !privateVars) {
    generatedManifest['private'] = {}
  }

  /**
  // Validate the digest of each container image
  debug('validating image digest...')
  const containers = generatedManifest['manifest']['containers']
  for (let i = 0; i < containers.length; i++) {
    await fetchImageDigest(generatedManifest, i)
  }
  **/

  debug(`Generated Manifest: ${JSON.stringify(generatedManifest, null, 2)}`)
  return generatedManifest
}

const validateCodiusFileSchema = function (codius, codiusPath) {
  const validateCodiusFile = jsen(codiusSchema, { greedy: true })
  validateCodiusFile(codius)
  const codiusSchemaErrors = validateCodiusFile.errors
  if (codiusSchemaErrors.length > 0) {
    throw new Error(`Invalid Codius file at ${codiusPath}
      errors: ${JSON.stringify(codiusSchemaErrors, null, 2)}`)
  }
}

const validateCodiusVarsFileSchema = function (codiusVars, codiusVarsPath) {
  const validateCodiusVarsFile = jsen(varsSchema, { greedy: true })
  validateCodiusVarsFile(codiusVars)
  const codiusVarsSchemaErrors = validateCodiusVarsFile.errors
  if (codiusVarsSchemaErrors.length > 0) {
    throw new Error(`Invalid Codius vars file at ${codiusVarsPath}
      errors: ${JSON.stringify(codiusVarsSchemaErrors, null, 2)}`)
  }
}

const validateFinalManifest = function (generatedManifest) {
  const errors = validateGeneratedManifest(generatedManifest)
  if (errors.length > 0) {
    throw new Error(`Generated manifest is invalid. errors:
      ${JSON.stringify(errors, null, 2)}`)
  }
}

const processPublicVars = function (generatedManifest, codiusVars) {
  // Update public vars in the final manifest
  const publicVars = codiusVars['vars']['public']
  const publicVarKeys = Object.keys(publicVars)

  // Check if public vars are specified in codiusvars
  if (publicVarKeys.length < 1) {
    return
  }

  const manifest = generatedManifest['manifest']
  const manifestVars = manifest['vars']
  // Add public vars to manifest vars
  if (manifest['vars']) {
    manifest['vars'] = { ...manifestVars, ...publicVars }
  } else {
    manifest['vars'] = publicVars
  }
}

const processPrivateVars = function (generatedManifest, codiusVars) {
  // Update private vars in the final manifest
  const privateVars = codiusVars['vars']['private']
  const privateVarKeys = Object.keys(privateVars)

  if (privateVarKeys.length < 1) {
    return
  }
  // Add nonce field to private vars
  privateVarKeys.map((varName) => {
    privateVars[varName]['nonce'] = cryptoUtils.generateNonce()
  })
  // Add private vars to final manifest
  generatedManifest['private'] = { vars: privateVars }
  addPrivateVarEncodings(generatedManifest)
}

const addPrivateVarEncodings = function (generatedManifest) {
  // Add public encodings for private variables
  const manifest = generatedManifest['manifest']
  if (!manifest['vars']) {
    manifest['vars'] = {}
  }
  const privateVarHashes = cryptoUtils.hashPrivateVars(generatedManifest)
  const privateVarKeys = Object.keys(privateVarHashes)
  privateVarKeys.map((varName) => {
    debug(`Generating public encoding for ${varName}`)
    const encoding = {
      'encoding': 'private:sha256',
      'value': privateVarHashes[varName]
    }
    manifest['vars'][varName] = encoding
    debug(`New encoding for ${varName}: ${JSON.stringify(encoding, null, 2)}`)
  })
}

const removeDescriptions = function (generatedManifest) {
  // Remove description fields from a generated manifest
  const publicVars = generatedManifest['manifest']['vars']
  if (!publicVars) {
    return
  }
  const publicVarKeys = Object.keys(publicVars)
  publicVarKeys.map((varName) => {
    const publicVar = publicVars[varName]
    if (publicVar['description']) {
      delete publicVar['description']
    }
  })
}

/**
const fetchImageDigest = function (generatedManifest, id) {
  const container = generatedManifest['manifest']['containers'][id]
  const image = container['image']
  if (image.includes('@sha256:')) {
    return generatedManifest
  }

  // Parse image id specified in manifest
  const tokens = image.split(':')
  if (tokens.length < 2) {
    throw new Error(`Invalid image has been specified ${image}`)
  }
  const tag = tokens.pop()
  const repo = tokens.join('')
  const client = drc.createClientV2({ name: repo })
  debug(`fetching digest for the image ${image}`)

  // fetch the digest for the image
  return new Promise(function (resolve, reject) {
    client.getManifest(
      { ref: tag },
      function (error, manifest, res, manifestStr) {
        client.close()
        if (error) {
          reject(error)
        }
        const digest = res.headers['docker-content-digest']
        if (!digest) {
          reject(new Error(`Error fetching digest for image ${image}`))
        }
        debug(`Successfully fetched image digest for image ${image}, digest: ${digest}`)
        container['image'] = `${repo}@${digest}`
        resolve(container['image'])
      }
    )
  })
}
**/

module.exports = {
  generateManifest
}
