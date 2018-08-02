/* eslint-env mocha */
const { expect } = require('chai')
const testManifest = JSON.stringify(require('./mocks/manifest.test.json'))
const { validateContainers } = require('../src/validate-containers.js')

describe('Validate Containers in Manifest', function () {
  let manifest

  beforeEach(function () {
    manifest = JSON.parse(testManifest)
  })

  it('should not return errors if containers in manifest are valid', function () {
    const errors = validateContainers(manifest)
    expect(errors).to.deep.equal([])
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
    const errors = validateContainers(manifest)
    const expected = [
      { 'manifest.containers[0].environment.ENV_VAR':
      'env variable is not defined within manifest.vars.' },
      { 'manifest.containers[1].environment.CODIUS_HOST':
      'environment variables starting in `CODIUS` are reserved.' }
    ]
    expect(errors).to.deep.equal(expected)
  })

  it('should return errors if env variable names begin with "CODIUS"', function () {
    let environment = manifest['manifest']['containers'][0]['environment']
    environment['CODIUS_VAR'] = '$CODIUS_VAR'
    manifest['manifest']['vars']['CODIUS_VAR'] = {'value': 'CODIUS_VAR'}
    manifest['private']['vars']['CODIUS_VAR'] = {'nonce': '1242352353', 'value': ''}
    const errors = validateContainers(manifest)
    const expected = [{ 'manifest.containers[0].environment.CODIUS_VAR':
    'environment variables starting in `CODIUS` are reserved.'
    }]
    expect(errors).to.deep.equal(expected)
  })

  it('should return errors if env variable is not defined in manifest.vars', function () {
    let environment = manifest['manifest']['containers'][0]['environment']
    environment['ENV_VAR'] = '$ENV_VAR'
    const errors = validateContainers(manifest)
    const expected = [{ 'manifest.containers[0].environment.ENV_VAR':
    'env variable is not defined within manifest.vars.' }]
    expect(errors).to.deep.equal(expected)
  })

  it('should return errors if encoded env variables are not defined in private manifest', function () {
    let environment = manifest['manifest']['containers'][0]['environment']
    environment['ENV_VAR'] = '$ENV_VAR'
    manifest['manifest']['vars']['ENV_VAR'] = {
      'encoding': 'private:sha256',
      'value': '95b3449d5b13a4e60e5c0' }
    const errors = validateContainers(manifest)
    const expected = [{ 'manifest.containers[0].environment.ENV_VAR':
    'encoded env variable is not defined within private manifest field' }]
    expect(errors).to.deep.equal(expected)
  })

  it('should return errors if two containers have the same id', function () {
    let containers = manifest['manifest']['containers']
    containers.push(manifest['manifest']['containers'][0])
    const errors = validateContainers(manifest)
    const expected = [{ 'manifest.containers': 'container ids must be unique.' }]
    expect(errors).to.deep.equal(expected)
  })
})
