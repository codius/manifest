const checkUsage = function (containers, varName) {
  // Check if public var is used in a container
  for (let i = 0; i < containers.length; i++) {
    const envVars = containers[i]['environment']
    if (envVars[varName]) {
      return true
    }
  }
  return false
}

exports.checkUsage = checkUsage
