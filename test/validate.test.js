const expect = require('chai').expect
const validateManifestSchema = require('../src/validateManifestSchema').validateManifestSchema
const testManifest = JSON.stringify(require('./mocks/manifest.test.json'))

describe('Check Manifest Schema Errors', function () {
  it('should not return empty array for valid schema', function () {
    const manifest = JSON.parse(testManifest)
    const result = validateManifestSchema(manifest)
    expect(result).to.deep.equal([])
  })

  it('should return an error for manifest with missing fields', function () {
    let manifest = JSON.parse(testManifest)
    delete manifest['manifest']['name']
    const result = validateManifestSchema(manifest)
    expect(result).to.deep.equal([{
      'keyword': 'required',
      'path': 'manifest.name'
    }])
  })

  it('should return an error for manifest with invalid additional fields', function () {
    let manifest = JSON.parse(testManifest)
    manifest['manifest']['InvalidField'] = 'This is an invalid field'
    const result = validateManifestSchema(manifest)
    expect(result).to.deep.equal([{
      'additionalProperties': 'InvalidField',
      'keyword': 'additionalProperties',
      'path': 'manifest'
    }])
  })

  it('should return an error for manifest with field of incorrect type', function () {
    let manifest = JSON.parse(testManifest)
    manifest['manifest']['name'] = 5
    const result = validateManifestSchema(manifest)
    expect(result).to.deep.equal([{
      'keyword': 'type',
      'path': 'manifest.name'
    }])
  })
})
