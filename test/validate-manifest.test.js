const expect = require('chai').expect
const testManifest = JSON.stringify(require('./mocks/manifest.test.json'))
const validateManifest = require('../src/validate-manifest.js').validateManifest

describe('Validate Entire Manifest', function () {
  it('should not return manifest is valid', function () {
    let manifest = JSON.parse(testManifest)
    const result = validateManifest(manifest)
    expect(result).to.deep.equal([])
  })

  it('should return errors if both schema and spec errors occur', function () {
    // Schema error: the required name value is not included in manifest
    let manifest = JSON.parse(testManifest)
    delete manifest['manifest']['name']

    // Spec error: env variable name should not begin with `CODIUS`
    let environment = manifest['manifest']['containers'][0]['environment']
    environment['CODIUS_VAR'] = '$CODIUS_VAR'
    manifest['manifest']['vars']['CODIUS_VAR'] = {'value': ''}

    const result = validateManifest(manifest)
    const expected = [
      { CODIUS_VAR: 'environment variables starting in "CODIUS" are reserved. var=CODIUS_VAR' },
      { name: "schema is invalid. errors=\"{'path':'manifest.name','keyword':" +
        "'required'}\""}
    ]
    expect(result).to.deep.equal(expected)
  })

  it('should return proper errors if public env vars are not defined', function () {
    let manifest = JSON.parse(testManifest)
    delete manifest['manifest']['vars']
    const result = validateManifest(manifest)
    const expected = [
      { AWS_ACCESS_KEY: 'env variable is not defined within manifest vars. var=AWS_ACCESS_KEY' },
      { AWS_SECRET_KEY: 'env variable is not defined within manifest vars. var=AWS_SECRET_KEY' },
      { 'manifest.vars': 'public vars are not defined. var=manifest.var' },
      { 'manfiest.private': 'cannot validate private vars - public vars are not defined.' }
    ]
    expect(result).to.deep.equal(expected)
  })
})
