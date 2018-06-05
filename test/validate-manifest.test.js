const expect = require('chai').expect
const testManifest = JSON.stringify(require('./mocks/manifest.test.json'))
const validateManifest = require('../src/validate-manifest.js').validateManifest

describe('Validate Entire Manifest', function () {
  let manifest

  beforeEach(function () {
    manifest = JSON.parse(testManifest)
  })

  it('should not return errors if manifest is valid', function () {
    const result = validateManifest(manifest)
    expect(result).to.deep.equal([])
  })

  it('should return proper errors if spec errors occur', function () {
    // Spec error: env variable name should not begin with `CODIUS`
    let environment = manifest['manifest']['containers'][0]['environment']
    environment['CODIUS_VAR'] = '$CODIUS_VAR'
    manifest['manifest']['vars']['CODIUS_VAR'] = {'value': ''}
    const result = validateManifest(manifest)
    const expected = [
      { 'manifest.containers[0].environment.CODIUS_VAR': 'environment variables starting in `CODIUS` are reserved.' }
    ]
    expect(result).to.deep.equal(expected)
  })

  it('should only return schema errors if both schema and spec errors occur', function () {
    // Schema error: the required name value is not included in manifest
    delete manifest['manifest']['name']

    // Spec error: env variable name should not begin with `CODIUS`
    let environment = manifest['manifest']['containers'][0]['environment']
    environment['CODIUS_VAR'] = '$CODIUS_VAR'
    manifest['manifest']['vars']['CODIUS_VAR'] = {'value': ''}

    const result = validateManifest(manifest)
    const expected = [
      { 'manifest.name': "schema is invalid. errors=\"{'path':'manifest.name','keyword':'required'}\"" }
    ]
    expect(result).to.deep.equal(expected)
  })

  it('should return proper errors if public env vars are not defined', function () {
    delete manifest['manifest']['vars']
    const result = validateManifest(manifest)
    const expected = [
      { 'manifest.containers[0].environment.AWS_ACCESS_KEY': 'env variable is not defined within manifest.vars.' },
      { 'manifest.containers[0].environment.AWS_SECRET_KEY': 'env variable is not defined within manifest.vars.' },
      { 'private': 'cannot validate private vars - manifest.vars is not defined.' }
    ]
    expect(result).to.deep.equal(expected)
  })
})
