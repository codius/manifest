const expect = require('chai').expect
const testManifest = JSON.stringify(require('./mocks/manifest.test.json'))
const validatePublicVars = require('../src/validate-public-vars.js').validatePublicVars

describe('Validate Public Manifest Variables', function () {
  let manifest

  beforeEach(function () {
    manifest = JSON.parse(testManifest)
  })

  it('should not return errors if manifest is valid', function () {
    const result = validatePublicVars(manifest, 0)
    expect(result).to.deep.equal([])
  })

  it('should not return errors if both the public and private variable fields are not defined', function () {
    delete manifest['manifest']['vars']
    const result = validatePublicVars(manifest)
    expect(result).to.deep.equal([])
  })

  it('should return errors if public variables are not used in environment', function () {
    delete manifest['manifest']['containers'][0]['environment']['AWS_ACCESS_KEY']
    const result = validatePublicVars(manifest, 0)
    const expected = [{ 'manifest.vars.AWS_ACCESS_KEY':
    'public var is not used within a container'
    }]
    expect(result).to.deep.equal(expected)
  })
})
