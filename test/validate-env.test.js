const expect = require('chai').expect
const testManifest = JSON.stringify(require('./mocks/manifest.test.json'))
const validateEnv = require('../src/validate-env.js').validateEnv

describe('Validate Manifest Environment Variables', function () {
  it('should not return errors if env variables are valid', function () {
    let manifest = JSON.parse(testManifest)
    const result = validateEnv(manifest, 0)
    expect(result).to.deep.equal([])
  })

  it('should return errors if env variable names begin with "CODIUS"', function () {
    let manifest = JSON.parse(testManifest)
    let environment = manifest['manifest']['containers'][0]['environment']
    environment['CODIUS_VAR'] = '$CODIUS_VAR'
    manifest['manifest']['vars']['CODIUS_VAR'] = {'value': ''}
    manifest['private']['vars']['CODIUS_VAR'] = {'nonce': '1242352353', 'value': ''}

    const result = validateEnv(manifest, 0)
    const expected = [{ CODIUS_VAR: 'environment variables starting in' +
      ' "CODIUS" are reserved. var=CODIUS_VAR' }]
    expect(result).to.deep.equal(expected)
  })

  it('should return errors if env variable is not defined in manifest.vars', function () {
    let manifest = JSON.parse(testManifest)
    let environment = manifest['manifest']['containers'][0]['environment']
    environment['ENV_VAR'] = '$ENV_VAR'

    const result = validateEnv(manifest, 0)
    const expected = [{ ENV_VAR: 'env variable is not defined within manifest' +
    ' vars. var=ENV_VAR' }]
    expect(result).to.deep.equal(expected)
  })

  it('should return errors if encoded env variables are not defined in private manifest', function () {
    let manifest = JSON.parse(testManifest)
    let environment = manifest['manifest']['containers'][0]['environment']
    environment['ENV_VAR'] = '$ENV_VAR'
    manifest['manifest']['vars']['ENV_VAR'] = {
      'encoding': 'private:sha256',
      'value': '95b3449d5b13a4e60e5c0' }

    const result = validateEnv(manifest, 0)
    const expected = [{ 'ENV_VAR': 'encoded env variable not ' +
      'defined within private manifestvar=ENV_VAR' }]
    expect(result).to.deep.equal(expected)
  })
})
