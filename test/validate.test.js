const expect = require('chai').expect
const validateManifestSchema = require('../src/validateManifestSchema').validateManifestSchema
const hashPrivateManifestVars = require('../src/crypto-utils').hashPrivateManifestVars
const testManifest = JSON.stringify(require('./mocks/manifest.test.json'))

describe('Check Manifest Schema Errors', function () {
  it('should return empty array for valid schema', function () {
    const manifest = JSON.parse(testManifest)
    const result = validateManifestSchema(manifest)
    expect(result).to.deep.equal([])
  })

  it('should return an error if manifest has missing fields', function () {
    let manifest = JSON.parse(testManifest)
    delete manifest['manifest']['name']
    const result = validateManifestSchema(manifest)
    expect(result).to.deep.equal([{
      'keyword': 'required',
      'path': 'manifest.name'
    }])
  })

  // TODO: Test for multiple extraneous fields
  it('should return an error if manifest has extraneous fields', function () {
    let manifest = JSON.parse(testManifest)
    manifest['manifest']['InvalidField'] = 'This is an invalid field'
    const result = validateManifestSchema(manifest)
    expect(result).to.deep.equal([{
      'additionalProperties': 'InvalidField',
      'keyword': 'additionalProperties',
      'path': 'manifest'
    }])
  })

  it('should return an error if manifest has fields with incorrect types', function () {
    let manifest = JSON.parse(testManifest)
    manifest['manifest']['name'] = 5
    const result = validateManifestSchema(manifest)
    expect(result).to.deep.equal([{
      'keyword': 'type',
      'path': 'manifest.name'
    }])
  })
})

describe('Generate Hash of Private Manifest Variables', function () {
  it('should return a map of private manifest variable hashes (sha256:hex)', function () {
    const manifest = JSON.parse(testManifest)
    const result = hashPrivateManifestVars(manifest)
    expect(result).to.deep.equal({ AWS_SECRET_KEY:
        '95b3449d5b13a4e60e5c0218021354c447907d1762bb410ba8d776bfaa1a3faf'})
  })
})
