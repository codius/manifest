const expect = require('chai').expect
const testManifest = JSON.stringify(require('./mocks/manifest.test.json'))
const validatePublicVars = require('../src/validate-public-vars.js').validatePublicVars

describe('Validate Public Manifest Variables', function () {
  it('should not return errors if manifest is valid', function () {
    let manifest = JSON.parse(testManifest)
    const result = validatePublicVars(manifest, 0)
    expect(result).to.deep.equal([])
  })

  it('should return errors if public variables are not used in environment', function () {
    let manifest = JSON.parse(testManifest)
    delete manifest['manifest']['containers'][0]['environment']['AWS_ACCESS_KEY']
    const result = validatePublicVars(manifest, 0)
    const expected = [{ AWS_ACCESS_KEY: 'public variable defined but never ' +
      'used in environment. var=AWS_ACCESS_KEY' }]
    expect(result).to.deep.equal(expected)
  })
})
