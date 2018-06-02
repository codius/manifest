const validateEnv = require('./validate-env.js').validateEnv
const validatePrivateVars = require('./validate-private-vars.js').validatePrivateVars
const validatePublicVars = require('./validate-public-vars.js').validatePublicVars

const validateContainers = function (manifest) {
  let errors = []

  const containers = manifest['manifest']['containers']
  for (let i = 0; i < containers.length; i++) {
    // TODO: fix: produces error if public variable is not used in all containers
    errors = errors.concat(
      validateEnv(manifest, i),
      validatePrivateVars(manifest, i),
      validatePublicVars(manifest, i)
    )
  }
  return errors
}

exports.validateContainers = validateContainers
