/* eslint-env mocha */
const { expect } = require('chai')
const testManifest = JSON.stringify(require('./mocks/manifest.test.json'))
const { validatePublicVars } = require('../src/validate-public-vars.js')

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

  it('should return errors if public vars are defined but there are no environment fields', function () {
    let containers = manifest['manifest']['containers']
    delete containers[0]['environment']
    const result = validatePublicVars(manifest)
    const expected = [{ 'manifest.vars.AWS_ACCESS_KEY': 'public var is not used within a container' },
      { 'manifest.vars.AWS_SECRET_KEY': 'public var is not used within a container' }]
    expect(result).to.deep.equal(expected)
  })
})
