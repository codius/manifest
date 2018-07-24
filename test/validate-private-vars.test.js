/* eslint-env mocha */
const { expect } = require('chai')
const testManifest = JSON.stringify(require('./mocks/manifest.test.json'))
const { validatePrivateVars } = require('../src/validate-private-vars.js')

describe('Validate Private Manifest Variables', function () {
  let manifest

  beforeEach(function () {
    manifest = JSON.parse(testManifest)
  })

  it('should not return errors for valid manifest', function () {
    const result = validatePrivateVars(manifest, 0)
    expect(result).to.deep.equal([])
  })

  it('should return errors if private variable hashes are inconsistent`', function () {
    manifest['manifest']['vars']['AWS_SECRET_KEY']['value'] = 'CODIUS'

    const result = validatePrivateVars(manifest, 0)
    const expected = [{ 'private.AWS_SECRET_KEY':
    'private var hash does not match the hashed value. public-hash=CODIUS ' +
    'hashed-value=95b3449d5b13a4e60e5c0218021354c447907d1762bb410ba8d776bfaa1a3faf'
    }]
    expect(result).to.deep.equal(expected)
  })

  it('should return errors if public variables are not defined', function () {
    delete manifest['manifest']['vars']
    const result = validatePrivateVars(manifest)
    expect(result).to.deep.equal([
      { 'private':
      'cannot validate private vars - manifest.vars is not defined.' }
    ])
  })

  it('should return errors if a private variable is never used in a container', function () {
    delete manifest['manifest']['containers'][0]['environment']['AWS_SECRET_KEY']

    const result = validatePrivateVars(manifest, 0)
    const expected = [{ 'private.AWS_SECRET_KEY':
    'private var is never used within a container'
    }]
    expect(result).to.deep.equal(expected)
  })
})
