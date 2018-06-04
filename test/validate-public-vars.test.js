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

  it('should return errors if public variables are not defined', function () {
    delete manifest['manifest']['vars']
    const result = validatePublicVars(manifest)
    expect(result).to.deep.equal([{
      'manifest.vars': 'public vars are not defined. var=manifest.var'
    }])
  })

  it('should return errors if public variables are not used in environment', function () {
    delete manifest['manifest']['containers'][0]['environment']['AWS_ACCESS_KEY']
    const result = validatePublicVars(manifest, 0)
    const expected = [{ AWS_ACCESS_KEY: 'public var defined but never ' +
      'used in a container environment. var=AWS_ACCESS_KEY' }]
    expect(result).to.deep.equal(expected)
  })
})
