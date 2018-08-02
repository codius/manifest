/* eslint-env mocha */
const { expect } = require('chai')
const { generateSimpleManifest } = require('../src/generate-simple-manifest.js')
const testManifest = JSON.stringify(require('./mocks/manifest.test.json'))
const testSimpleManifest = JSON.stringify(require('./mocks/simple-manifest.test.json'))

describe('Generate Simple Manifest', function () {
  let manifest
  let simpleManifest

  beforeEach(function () {
    manifest = JSON.parse(testManifest)
    simpleManifest = JSON.parse(testSimpleManifest)
  })

  it('should generate correct simple manifest if original manifest is valid', function () {
    const result = generateSimpleManifest(manifest)
    expect(simpleManifest).to.deep.equal(result)
  })

  it('should skip interpolation if manifest has no environment fields', function () {
    delete manifest['manifest']['vars']
    delete manifest['private']
    delete manifest['manifest']['containers'][0]['environment']
    delete simpleManifest['manifest']['containers'][0]['environment']

    const result = generateSimpleManifest(manifest)
    expect(simpleManifest).to.deep.equal(result)
  })

  it('should throw error if manifest has schema errors', function () {
    delete manifest['manifest']['name']
    expect(() => {
      generateSimpleManifest(manifest)
    }).to.throw()
  })

  it('should properly interpolate literals within container environments', function () {
    manifest['manifest']['containers'][0]['environment']['ENV_LITERAL'] = 'ENV_LITERAL'
    simpleManifest['manifest']['containers'][0]['environment']['ENV_LITERAL'] = 'ENV_LITERAL'
    const result = generateSimpleManifest(manifest)
    expect(simpleManifest).to.deep.equal(result)
  })
})
