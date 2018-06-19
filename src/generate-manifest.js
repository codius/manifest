const codiusSchema = require('../schemas/CodiusSpec.json')
const varsSchema = require('../schemas/CodiusVarsSpec.json')
const debug = require('debug')('codius-manifest:generate-manifest')
const drc = require('docker-registry-client')
const fse = require('fs-extra')
const { hashPrivateVars } = require('./common/crypto-utils.js')
const jsen = require('jsen')
const { validateGeneratedManifest } = require('./validate-generated-manifest.js')

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

  // check the digest of each container image
  const containers = generatedManifest['manifest']['containers']
  for (let i = 0; i < containers.length; i++) {
    await fetchImageDigest(generatedManifest, i)
  }

  // check if the generated manifest is valid
  const errors = validateGeneratedManifest(generatedManifest)
  if (errors.length > 0) {
    throw new Error(`Generated manifest is invalid. errors:
      ${JSON.stringify(errors, null, 2)}`)
  }

  debug(`Generated Manifest: ${JSON.stringify(generatedManifest, null, 2)}`)
  return generatedManifest
}

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
