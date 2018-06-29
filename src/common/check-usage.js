const checkUsage = function (manifest, varName) {
  // check if variable is present within an environment
  const containers = manifest['manifest']['containers']
  // Check if a public or private variable is used in a container environment
  // The variable is used if a key in a container maps to the variable
  // Or there is an environment variable equal to $ + varName

  for (let i = 0; i < containers.length; i++) {
    const container = containers[i]
    const envVars = container['environment'] || {}

    // Check if there is a key that corresponds to the variable name
    if (envVars[varName]) {
      return true
    } else {
      // Check if there's an env value that equals `$ + varName`
      let isUsed = false
      Object.values(envVars).map((envValue) => {
        if (envValue.startsWith('$')) {
          if (envValue.substring(1) === varName) {
            isUsed = true
          }
        }
      })
      if (isUsed) {
        return true
      }
    }
  }

  return false
}

module.exports = {
  checkUsage
}
