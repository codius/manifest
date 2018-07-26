# Codius Manifest

[Codius](https://codius.org) is an open-source decentralized hosting platform using [Interledger](https://interledger.org). It allows anyone to run software on servers all over the world and pay using any currency. Users package their software inside of [containers](https://www.docker.com/what-container). Multiple containers can run together inside of a [pod](https://kubernetes.io/docs/concepts/workloads/pods/pod/).

**Codius Manifest** (this repository) is a module for validating and generating Codius manifests.
The Codius manifest format allows users to specify container images, public and
private environment variables, and other information about pods. Manifests are used
by [Codius hosts](https://github.com/codius/codiusd) to setup the container environments and download images.

## Manifest Format
Manifests must match the standard format, which is specified [here](https://github.com/codius/manifest/blob/master/schemas/GeneratedManifestSpec.json).
Manifests that are valid against the standard schema are considered complete.
```json
{
  "manifest": {
    "name": "my-codius-pod",
    "version": "1.0.0",
    "machine": "small",
    "port": " 8080",
    "containers": [{
      "id": "app",
      "image": "hello-world@sha256:f5233545e43561214ca4891fd1157e1c3c563316ed8e237750d59bde73361e77",
      "command": ["/bin/sh"],
      "workdir": "/root",
      "environment": {
        "AWS_ACCESS_KEY": "$AWS_ACCESS_KEY",
        "AWS_SECRET_KEY": "$AWS_SECRET_KEY"
      }
    }],
    "vars": {
      "AWS_ACCESS_KEY": {
        "value": "AKRTP2SB9AF5TQQ1N1BB"
      },
      "AWS_SECRET_KEY": {
        "encoding": "private:sha256",
        "value": "95b3449d5b13a4e60e5c0218021354c447907d1762bb410ba8d776bfaa1a3faf"
      }
    }
  },
  "private": {
    "vars": {
      "AWS_SECRET_KEY": {
        "nonce": "123450325",
        "value": "AKRTP2SB9AF5TQQ1N1BC"
      }
    }
  }
}
```
## Simple Manifest
A simple manifest has the environment fields fully interpolated, with the public and private
variable fields removed.

```json
{
  "manifest": {
    "name": "my-codius-pod",
    "version": "1.0.0",
    "machine": "small",
    "port": " 8080",
    "containers": [{
      "id": "app",
      "image": "hello-world@sha256:f5233545e43561214ca4891fd1157e1c3c563316ed8e237750d59bde73361e77",
      "command": ["/bin/sh"],
      "workdir": "/root",
      "environment": {
        "AWS_ACCESS_KEY": "AKRTP2SB9AF5TQQ1N1BB",
        "AWS_SECRET_KEY": "AKRTP2SB9AF5TQQ1N1BC"
      }
    }]
  }
}
```

## Codius Files
Manifests are generated from two files: `codius.json` and `codiusvars.json`.
### `codius.json`
This file includes details about the pod to be uploaded . Unlike the generated manifest, `codius.json`
may contain description fields for public variables. The official specification can be found
[here](https://github.com/codius/manifest/blob/master/schemas/CodiusSpec.json).
```json
{
  "manifest": {
    "name": "my-codius-pod",
    "version": "1.0.0",
    "machine": "small",
    "port": "8080",
    "containers": [{
      "id": "app",
      "image": "hello-world@sha256:f5233545e43561214ca4891fd1157e1c3c563316ed8e237750d59bde73361e77",
      "command": ["/bin/sh"],
      "workdir": "/root",
      "environment": {
        "AWS_ACCESS_KEY": "$AWS_ACCESS_KEY",
        "AWS_SECRET_KEY": "$AWS_SECRET_KEY"
      }
    }],
    "vars": {
      "AWS_ACCESS_KEY": {
        "value": "AKRTP2SB9AF5TQQ1N1BB"
      },
      "AWS_SECRET_KEY": {
        "encoding": "private:sha256",
        "value": "95b3449d5b13a4e60e5c0218021354c447907d1762bb410ba8d776bfaa1a3faf"
      }
    }
  }
}
```

### `codiusvars.json`
This file defines the public and private variables to be included in the
generated manifest. Similar to `codius.json`, this file may include description
fields for the public variables. The official specification can be found
[here](https://github.com/codius/manifest/blob/master/schemas/CodiusVarsSpec.json).
```json
{
  "vars": {
    "public": {
      "AWS_ACCESS_KEY": {
        "value": "AKRTP2SB9AF5TQQ1N1BB",
        "description": "My AWS access key"
      }
    },
    "private": {
      "AWS_SECRET_KEY": {
        "nonce": "123450325",
        "value": "AKRTP2SB9AF5TQQ1N1BC"
      }
    }
  }
}
```
# Reference
The Codius manifest module exports the following functions to validate and generate manifests.
```
  validateGeneratedManifest(manifest)
  generateManifest(codiusVarsPath, codiusPath)
  hashManifest(manifest)
 ```

### `validateGeneratedManifest(manifest)`
Validates a generated manifest against the standard manifest schema.

Arguments:
* `manifest`
  * Type: JSON
  * Description: the manifest to be validated

The function returns an array of errors in the following format:

`[ { <varPath1>: <errorMsg1> }, { <varPath2>: <errorMsg2> }, ... ]`

For example:
```js
[
  { 'manifest.containers[0].environment.ENV_VAR': 'env variable is not defined within manifest.vars.' },
  { 'manifest.name': "schema is invalid. error={'path':'manifest.name','keyword':'required'}" }
 ]
```

### `generateManifest(codiusVarsPath, codiusPath)`
Generates a manifest from `codiusvars.json` and `codius.json`. An error will be
thrown if the generated manifest is invalid.

Arguments:
* `codiusVarsPath`
  * Type: string
  * Description: the path to a `codiusvars.json` file
* `codiusPath`
  * Type: string
  * Description: the path to a `codius.json` file

The function returns a JSON object representing the generated manifest.

*NOTE: Docker image fields without a `sha256` hash will be resolved to include the image digest.* For example:
```text
  nginx:1.15.0 => nginx@sha256:62a095e5da5f977b9f830adaf64d604c614024bf239d21068e4ca826d0d629a4
```
This ensures that a host will pull identical images for a single manifest upon multiple uploads.
The image resolution functionality was partially adapted from the [docker-manifest](https://github.com/bmonty/docker-manifest) module.

### `hashManifest(manifest)`
Generates the hash of a complete Codius manifest.

Arguments:
* `manifest`
  * Type: JSON
  * Description: the manifest to be hashed

The function returns the `sha256` manifest hash with `base32` encoding.

### `generateSimpleManifest(manifest)`
Generates a manifest with the container environment fields interpolated.

Arguments:
* `manifest`
  * Type: JSON
  * Description: the manifest to be interpolated

The function returns a JSON object representing the interpolated manifest, with the public and private variable fields removed.

## Usage
The module can be used to easily generate manifest files.
```js
const { generateManifest, hashManifest } = require('codius-manifest')

async function generateManifestHash (codiusVarsPath, codiusPath) {
  // generate new manifest
  const generatedManifest = await generateManifest(codiusVarsPath, codiusPath)
  console.log(`New Manifest: ${JSON.stringify(generatedManifest, null, 2)}`)

  // generate manifest hash
  const manifestHash = hashManifest(generatedManifest)
  console.log(`New Manifest Hash: ${manifestHash}`)
  return manifestHash
}

const codiusVarsPath = './codiusvars.json'
const codiusPath = './codius.json'
generateManifestHash(codiusVarsPath, codiusPath)
  .then(() => { console.log('Success!') })
  .catch(error => { console.log(error) })
```

## License

Apache-2.0
