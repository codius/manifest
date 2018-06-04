const expect = require('chai').expect
const testManifest = JSON.stringify(require('./mocks/manifest.test.json'))
const validateContainers = require('../src/validate-containers.js').validateContainers

describe('Validate Containers in Manifest', function () {
  let manifest

  beforeEach(function () {
    manifest = JSON.parse(testManifest)
  })

  it('should not return errors if containers in manifest are valid', function () {
    const result = validateContainers(manifest)
    expect(result).to.deep.equal([])
  })

  it('should return errors if there are issues with multiple containers', function () {
    // Insert container with environment variable that starts with `CODIUS`
    manifest['manifest']['containers'].push({
      'id': 'test-app',
      'image': 'test-app@sha256:f5233545e43561214ca4891f',
      'command': ['/bin/sh'],
      'workdir': '/root',
      'environment': {
        'CODIUS_HOST': '$CODIUS_HOST',
        'AWS_SECRET_KEY': 'AWS_SECRET_KEY'
      }})

    manifest['manifest']['vars']['CODIUS_HOST'] = {'value': 'CODIUS_HOST'}

    // Insert environment variable without adding it to manifest.vars
    let environment = manifest['manifest']['containers'][0]['environment']
    environment['ENV_VAR'] = '$ENV_VAR'
    const result = validateContainers(manifest)
    const expected = [
      { ENV_VAR: 'env variable is not defined within manifest vars. var=ENV_VAR' },
      { 'manifest.containers[1].environment.CODIUS_HOST':
      'environment variables starting in `CODIUS` are reserved.' }
    ]
    expect(result).to.deep.equal(expected)
  })

  it('should return errors if env variable names begin with "CODIUS"', function () {
    let environment = manifest['manifest']['containers'][0]['environment']
    environment['CODIUS_VAR'] = '$CODIUS_VAR'
    manifest['manifest']['vars']['CODIUS_VAR'] = {'value': 'CODIUS_VAR'}
    manifest['private']['vars']['CODIUS_VAR'] = {'nonce': '1242352353', 'value': ''}

    const result = validateContainers(manifest)
    const expected = [{ 'manifest.containers[0].environment.CODIUS_VAR':
    'environment variables starting in `CODIUS` are reserved.'
    }]
    expect(result).to.deep.equal(expected)
  })

  it('should return errors if env variable is not defined in manifest.vars', function () {
    let environment = manifest['manifest']['containers'][0]['environment']
    environment['ENV_VAR'] = '$ENV_VAR'

    const result = validateContainers(manifest)
    const expected = [{ ENV_VAR: 'env variable is not defined within manifest' +
    ' vars. var=ENV_VAR' }]
    expect(result).to.deep.equal(expected)
  })

  it('should return errors if encoded env variables are not defined in private manifest', function () {
    let environment = manifest['manifest']['containers'][0]['environment']
    environment['ENV_VAR'] = '$ENV_VAR'
    manifest['manifest']['vars']['ENV_VAR'] = {
      'encoding': 'private:sha256',
      'value': '95b3449d5b13a4e60e5c0' }

    const result = validateContainers(manifest)
    const expected = [{ 'ENV_VAR': 'encoded env variable not ' +
      'defined within private manifestvar=ENV_VAR' }]
    expect(result).to.deep.equal(expected)
  })
})
