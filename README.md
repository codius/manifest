# Codius Manifest Format

[Codius](https://codius.org) is an open-source decentralized hosting platform using [Interledger](https://interledger.org). It allows anyone to run software on servers all over the world and pay using any currency. Users package their software inside of [containers](https://www.docker.com/what-container). Multiple containers can run together inside of a [pod](https://kubernetes.io/docs/concepts/workloads/pods/pod/).

**Codius Manifest** (this repository) is a module for validating and configuring Codius manifests.
The Codius manifest format allows users to specify container images, public and
private environment variables, and other information about pods. Manifests are used
by [Codius hosts](https://github.com/codius/codiusd) to setup the container environments and download images.

## Manifest Example
Manifests must match the standard format, which is specified [here](https://github.com/codius/manifest/blob/master/src/schemas/ManifestSpec.json).
```json
{
  "name": "test-app",
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
      "value": "d429d080fa3a4629afb7d0759640b60f8ac70b377c72c048cdff9e5ef73dd6c2"
    }
  }
}
```

## Full Codius Request Body
The full Codius request body may include private variables that should not be exposed publicly by the host.

```json
{
  "manifest": {
    "name": "test-app",
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
        "value": "aa965f3036ee2e6496cd961d9ed75626bc600ff1636b8cd909974dae2eb19208"
      }
    }
  },
  "private": {
    "vars": {
      "AWS_SECRET_KEY": {
        "nonce": "1234530325",
        "value": "AKRTP2SB9AF5TQQ1N1BC"
      }
    }
  }
}
```

# Reference

The Codius manifest module exports the following functions to configure and validate manifests.

```
  validateManifest(manifest)
  generateNonce()
  hashManifest(manifest)
  hashPrivateVars(manifest)

 ```

### `validateManifest(manifest)`
Validates the manifest against the standard manifest schema.

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

### `generateNonce()`
Generates the nonce for the hash of the private variable object in the manifest.
 The function returns a string representing the 16 byte nonce in `hex`.


### `hashManifest(manifest)`
Generates the hash of a Codius manifest.

Arguments:
* `manifest`
  * Type: JSON
  * Description: the manifest to be hashed

The function returns the `sha256` manifest hash with `base32` encoding.

### `hashPrivateVars(manifest)`
Generates the hashes of the private variable objects in the manifest.

Arguments:
* `manifest`
  * Type: JSON
  * Description: a manifest with private variables

The function returns an object of the form `{ <varName>: <hash> ... }`.
The private variable hashes are generated using `sha256` and are encoded in `hex`.

## Usage
The module can be used to easily validate and configure manifest files.
```js

const validate = require('codius-manifest')
const fse = require('fs-extra')

async function generateNonces(manifestPath) {
  let manifest = await fse.readJson(manifestPath)

  // check if manifest is valid
  console.log('validating manifest...')
  const errors = validate.validateManifest(manifest)
  if (errors.length) {
    errors.forEach((error) => {
      console.log(JSON.stringify(error))
    })
    throw new Error('Manifest is invalid')
  }

  // Generate new nonces for private variables
  console.log('generating new private var nonces ...')
  let privateVars = Object.keys(manifest.private.vars)
  privateVars.map((varName) => {
    manifest.private.vars[varName].nonce = validate.generateNonce()
  })

  // generate manifest hash
  const manifestHash = validate.hashManifest(manifest)
  console.log(`New Manifest Hash: ${manifestHash}`)

  // generate new private var hashes
  console.log('generating private var hashes...')
  const hashes = validate.hashPrivateVars(manifest)
  console.log(`private var hashes: ${JSON.stringify(hashes)}`)
}

generateNonces('./manifest.json')
```

## License

Apache-2.0
