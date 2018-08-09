/* eslint-env mocha */
const { expect } = require('chai')
const testManifest = JSON.stringify(require('./mocks/manifest.test.json'))
const { validateGeneratedManifest } = require('../src/validate-generated-manifest.js')

describe('Validate Entire Manifest', function () {
  let manifest

  beforeEach(function () {
    manifest = JSON.parse(testManifest)
  })

  it('should not return errors if manifest is valid', function () {
    const errors = validateGeneratedManifest(manifest)
    expect(errors).to.deep.equal([])
  })

  it('should return proper errors if spec errors occur', function () {
    // Spec error: env variable name should not begin with `CODIUS`
    let environment = manifest['manifest']['containers'][0]['environment']
    environment['CODIUS_VAR'] = '$CODIUS_VAR'
    manifest['manifest']['vars']['CODIUS_VAR'] = {'value': ''}
    const errors = validateGeneratedManifest(manifest)
    const expected = [
      { 'manifest.containers[0].environment.CODIUS_VAR': 'environment variables starting in `CODIUS` are reserved.' }
    ]
    expect(errors).to.deep.equal(expected)
  })

  it('should only return schema errors if both schema and spec errors occur', function () {
    // Schema error: the required name value is not included in manifest
    delete manifest['manifest']['name']

    // Spec error: env variable name should not begin with `CODIUS`
    let environment = manifest['manifest']['containers'][0]['environment']
    environment['CODIUS_VAR'] = '$CODIUS_VAR'
    manifest['manifest']['vars']['CODIUS_VAR'] = {'value': ''}

    const errors = validateGeneratedManifest(manifest)
    const expected = [
      { 'manifest.name': "schema is invalid. error={'path':'manifest.name','keyword':'required'}" }
    ]
    expect(errors).to.deep.equal(expected)
  })

  it('should return proper errors if public env vars are not defined', function () {
    delete manifest['manifest']['vars']
    const errors = validateGeneratedManifest(manifest)
    const expected = [
      { 'manifest.containers[0].environment.AWS_ACCESS_KEY': 'cannot validate env variable - manifest.vars not defined' },
      { 'manifest.containers[0].environment.AWS_SECRET_KEY': 'cannot validate env variable - manifest.vars not defined' },
      { 'private': 'cannot validate private vars - manifest.vars is not defined.' }
    ]
    expect(errors).to.deep.equal(expected)
  })

  it('should return error if public var has encoding but private vars are undefined', function () {
    manifest['manifest']['containers'][0]['environment'] = {
      EXAMPLE_PUBLIC_ENV: '$EXAMPLE_PUBLIC_ENV',
      EXAMPLE_PRIVATE_ENV: '$EXAMPLE_PRIVATE_ENV'
    }
    manifest['manifest']['vars'] = {
      EXAMPLE_PUBLIC_ENV: {
        value: 'Public Env Value'
      },
      EXAMPLE_PRIVATE_ENV: {
        encoding: 'private:sha256',
        value: '52164a473520cf78e5893a279aca159f2fe4749b958992f1ff445f4858ae60a3'
      }
    }

    delete manifest['private']
    const errors = validateGeneratedManifest(manifest)
    const expected = [{
      'manifest.vars.EXAMPLE_PRIVATE_ENV': 'public var has encoding but private.vars is undefined'
    }]
    expect(errors).to.deep.equal(expected)
  })
})
