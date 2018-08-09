const { validateGeneratedManifest } = require('./validate-generated-manifest.js')

const generateSimpleManifest = function (manifest) {
  // This function generates a simplified manifest with the container
  // environment fields fully interpolated

  const manifestErrors = validateGeneratedManifest(manifest)
  if (manifestErrors.length) {
    throw new Error(`Invalid manifest. errors=${JSON.stringify(manifestErrors, null, 2)}`)
  }
  const simpleManifest = {
    manifest: {
      name: manifest['manifest']['name'],
      version: manifest['manifest']['version'],
      machine: manifest['manifest']['machine'],
      containers: deepcopy(manifest['manifest']['containers'])
    }
  }

  const simpleContainers = simpleManifest['manifest']['containers']
  simpleContainers.map((container) => {
    processContainer(manifest, container)
  })
  return simpleManifest
}

const processContainer = function (manifest, container) {
  const environment = container['environment']
  if (!environment) {
    return
  }

  Object.keys(environment).map((key) => {
    const value = environment[key]
    const varName = value.substring(1)

    if (!value.startsWith('$')) {
      return
    }
    const varSpec = manifest['manifest']['vars'][varName]
    if (!varSpec.encoding) {
      environment[key] = varSpec.value
      return
    }

    const privateVarSpec = manifest['private']['vars'][varName]
    environment[key] = privateVarSpec.value
  })
}

const deepcopy = function (obj) {
  return JSON.parse(JSON.stringify(obj))
}

module.exports = {
  generateSimpleManifest
}
