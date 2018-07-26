const axios = require('axios')
const debug = require('debug')('codius-manifest:resolve-image')
const parseImage = require('docker-parse-image')
const DEFAULT_REGISTRY = 'https://registry-1.docker.io/v2/'

const getRegistryUrl = function (image) {
  const parsedImage = parseImage(image)
  const registry = parsedImage.registry
  let registryUrl
  if (registry) {
    registryUrl = `https://${registry}/v2/`
  } else {
    registryUrl = DEFAULT_REGISTRY
  }
  return registryUrl
}

const getAuthInfo = async function (image) {
  try {
    const registryUrl = getRegistryUrl(image)
    // Returns 401 response with auth requirements for registry
    debug(`fetching auth requirements from registry. registryUrl=${registryUrl}`)
    const realmResp = await axios.get(registryUrl, {
      validateStatus: (status) => { return status === 401 }
    })
    const authInfo = {}
    const realmInfo = realmResp.headers['www-authenticate'] // Realm and service params
    if (realmInfo) {
      const re = /Bearer realm="(.*)",service="(.*)"/i
      const found = realmInfo.match(re)
      if (found) {
        [, authInfo.realm, authInfo.service] = found
      }
    } else {
      throw new Error('Failed to parse realm and service info from registry.')
    }
    return authInfo
  } catch (err) {
    debug(err)
    throw new Error('Failed to get authentication info from registry')
  }
}

const getAuthToken = async function (image, authInfo) {
  try {
    const { namespace, repository } = parseImage(image)
    const tokenOpts = {
      params: {
        service: authInfo.service,
        scope: `repository:${namespace || 'library'}/${repository}:pull`
      }
    }

    debug(`fetching auth token for realm. realm=${authInfo.realm}`)
    const tokenResp = await axios.get(authInfo.realm, tokenOpts)
    const token = tokenResp.data.token
    if (!token) {
      throw new Error("Can't get authentication token from registry.")
    }
    const tokenInfo = {
      ...authInfo,
      token: token
    }
    return tokenInfo
  } catch (err) {
    debug(err)
    throw new Error('Failed to get authentication token from registry.')
  }
}

const getManifestResp = async function (image, token) {
  try {
    const manifestOptions = {
      headers: {
        Authorization: `Bearer ${token.token}`,
        // Required header for manifest endpoint - see https://github.com/docker/distribution/issues/1565
        Accept: 'application/vnd.docker.distribution.manifest.v2+json'
      }
    }

    const { namespace, repository, tag } = parseImage(image)
    const registryUrl = getRegistryUrl(image)

    // Build url for manifest request - see https://docs.docker.com/registry/spec/api/
    let manifestUrl = `${registryUrl}${namespace || 'library'}/${repository}/manifests/${tag || 'latest'}`
    debug(`fetching manifest info from registry manifest endpoint. manifestUrl=${manifestUrl} manifestOptions=${JSON.stringify(manifestOptions, null, 2)}`)
    const { data, headers } = await axios.get(manifestUrl, manifestOptions)
    return { data, headers }
  } catch (err) {
    debug(err)
    throw new Error('Unable to get manifest info from registry.')
  }
}

const resolveImage = async function (image) {
  debug(`validating image. image=${image}`)
  const re = /^.+@sha256:[A-Fa-f0-9]{64}$/
  if (image.match(re)) {
    return image
  }

  debug(`fetching auth info for image. image=${image}`)
  const authInfo = await getAuthInfo(image)
  debug(`retrieved auth info. authInfo=${JSON.stringify(authInfo, null, 2)}`)
  debug(`fetching auth token to retrieve manifest for image. image=${image}`)
  const token = await getAuthToken(image, authInfo)
  debug(`retrieved auth token. token=${JSON.stringify(token, null, 2)}`)
  debug(`retrieving manifest for image. image=${image}`)
  const manifestResp = await getManifestResp(image, token)
  debug(`received manifest response. manifestResp=${JSON.stringify(manifestResp, null, 2)}`)
  debug(`generating resolved version of image. image=${image}`)
  const digest = manifestResp.headers['docker-content-digest']
  const { registry, namespace, repository } = parseImage(image)
  const resolvedRegistry = registry ? `${registry}/` : ''
  const resolvedName = namespace ? `${namespace}/` : ''
  const resolvedImage = `${resolvedRegistry}${resolvedName}${repository}@${digest}`
  debug(`successfully resolved image. resolvedImage=${resolvedImage}`)
  return resolvedImage
}

module.exports = {
  resolveImage
}
