const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const { expect } = chai
chai.use(chaiAsPromised)
const cryptoUtils = require('../src/common/crypto-utils.js')
const fse = require('fs-extra')
const { after, before, beforeEach, describe, it } = require('mocha')
const { generateManifest } = require('../src/generate-manifest.js')
const sinon = require('sinon')
const validManifestMock = './test/mocks/manifest.test.json'
const varsStatic = './test/mocks/codiusvars.test.json'
const varsMock = './test/codiusvars.mock.json'
const manifestStatic = './test/mocks/codius.test.json'
const manifestMock = './test/mocks/codius.mock.json'

describe('Generate Complete Manifest', function () {
  let validManifest = fse.readJsonSync(validManifestMock)
  const varsJson = fse.readJsonSync(varsStatic) // codiusvars.json
  const manifestJson = fse.readJsonSync(manifestStatic) // codius.json

  before(function () {
    // Create stub for generateNonce function
    const stub = sinon.stub(cryptoUtils, 'generateNonce')
    stub.returns('123450325')
  })

  beforeEach(async function () {
    // Create mocks for codiusvars.json and codius.json
    await fse.writeJson(varsMock, varsJson)
    await fse.writeJson(manifestMock, manifestJson)
  })

  after(async function () {
    // Remove the codiusvars.json and codius.json mock files
    await fse.remove(varsMock)
    await fse.remove(manifestMock)
  })

  it('should return the correct manifest when given valid codius files', async function () {
    const result = await generateManifest(varsStatic, manifestStatic)
    expect(result).to.deep.equal(validManifest)
  })

  it('should throw error if the codius manifest has schema errors', async function () {
    const manifest = JSON.parse(JSON.stringify(manifestJson))
    delete manifest['manifest']['name']
    await fse.writeJson(manifestMock, manifest)
    const result = generateManifest(varsMock, manifestMock)
    return expect(result).to.be.rejected
  })

  it('should throw error if codiusvars has schema errors', async function () {
    const vars = JSON.parse(JSON.stringify(varsJson))
    delete vars['vars']
    await fse.writeJson(varsMock, vars)
    const result = generateManifest(varsMock, manifestMock)
    return expect(result).to.be.rejected
  })

  it('should override public vars that are already defined', async function () {
    const manifest = JSON.parse(JSON.stringify(manifestJson))
    manifest['manifest']['vars']['AWS_ACCESS_KEY'] = { value: 'ABSCEDADFSDSF' }
    await fse.writeJson(manifestMock, manifest)
    const result = generateManifest(varsMock, manifestMock)
    return expect(result).to.eventually.become(validManifest)
  })

  it('should create the public encoding for private variables', async function () {
    const manifest = JSON.parse(JSON.stringify(manifestJson))
    delete manifest['manifest']['vars']['AWS_SECRET_KEY']
    await fse.writeJson(manifestMock, manifest)
    const result = generateManifest(varsMock, manifestMock)
    return expect(result).to.eventually.become(validManifest)
  })

  it('should override the public encodings for all private vars', async function () {
    const manifest = JSON.parse(JSON.stringify(manifestJson))
    manifest['manifest']['vars']['AWS_SECRET_KEY'] = {
      'encoding': 'private:sha256',
      'value': 'thisaninvalidhash'
    }
    await fse.writeJson(manifestMock, manifest)
    const result = generateManifest(varsMock, manifestMock)
    return expect(result).to.eventually.become(validManifest)
  })

  it('should remove all description fields from the final manifest', async function () {
    const manifest = JSON.parse(JSON.stringify(manifestJson))
    manifest['manifest']['vars']['AWS_SECRET_KEY']['description'] = 'An AWS secret key'
    manifest['manifest']['vars']['AWS_ACCESS_KEY']['description'] = 'An AWS access key'
    await fse.writeJson(manifestMock, manifest)
    const result = generateManifest(varsMock, manifestMock)
    return expect(result).to.eventually.become(validManifest)
  })

  it('should not include manifest.vars and manifest.private in final manifest if codiusvars has empty public and private var fields', async function () {
    const manifest = JSON.parse(JSON.stringify(manifestJson))
    delete manifest['manifest']['vars']
    manifest['manifest']['containers'][0]['environment']['AWS_SECRET_KEY'] = 'AWS_SECRET_KEY'
    manifest['manifest']['containers'][0]['environment']['AWS_ACCESS_KEY'] = 'AWS_ACCESS_KEY'
    await fse.writeJson(manifestMock, manifest)

    const vars = JSON.parse(JSON.stringify(varsJson))
    vars['vars']['public'] = {}
    vars['vars']['private'] = {}
    await fse.writeJson(varsMock, vars)

    const newValidManifest = JSON.parse(JSON.stringify(validManifest))
    delete newValidManifest['manifest']['vars']
    delete newValidManifest['private']
    newValidManifest['manifest']['containers'][0]['environment']['AWS_SECRET_KEY'] = 'AWS_SECRET_KEY'
    newValidManifest['manifest']['containers'][0]['environment']['AWS_ACCESS_KEY'] = 'AWS_ACCESS_KEY'
    const result = generateManifest(varsMock, manifestMock)
    return expect(result).to.eventually.become(newValidManifest)
  })

  it('should add an empty private var field to the final manifest if the public vars are defined', async function () {
    const manifest = JSON.parse(JSON.stringify(manifestJson))
    delete manifest['manifest']['vars']['AWS_SECRET_KEY']
    delete manifest['manifest']['containers'][0]['environment']['AWS_SECRET_KEY']
    delete manifest['private']
    await fse.writeJson(manifestMock, manifest)

    const vars = JSON.parse(JSON.stringify(varsJson))
    delete vars['vars']['private']['AWS_SECRET_KEY']
    await fse.writeJson(varsMock, vars)

    const newValidManifest = JSON.parse(JSON.stringify(validManifest))
    newValidManifest['private'] = {}
    delete newValidManifest['manifest']['containers'][0]['environment']['AWS_SECRET_KEY']
    delete newValidManifest['manifest']['vars']['AWS_SECRET_KEY']
    const result = generateManifest(varsMock, manifestMock)
    return expect(result).to.eventually.become(newValidManifest)
  }

  )

  it('should add public encodings for private vars field even if public vars are not defined in codiusvars', async function () {
    const manifest = JSON.parse(JSON.stringify(manifestJson))
    delete manifest['manifest']['vars']
    manifest['manifest']['containers'][0]['environment']['AWS_SECRET_KEY'] = '$AWS_SECRET_KEY'
    manifest['manifest']['containers'][0]['environment']['AWS_ACCESS_KEY'] = 'AWS_ACCESS_KEY'
    await fse.writeJson(manifestMock, manifest)

    const vars = JSON.parse(JSON.stringify(varsJson))
    vars['vars']['public'] = {}
    await fse.writeJson(varsMock, vars)

    const newValidManifest = JSON.parse(JSON.stringify(validManifest))
    delete newValidManifest['manifest']['vars']['AWS_ACCESS_KEY']
    newValidManifest['manifest']['containers'][0]['environment']['AWS_SECRET_KEY'] = '$AWS_SECRET_KEY'
    newValidManifest['manifest']['containers'][0]['environment']['AWS_ACCESS_KEY'] = 'AWS_ACCESS_KEY'
    const result = generateManifest(varsMock, manifestMock)
    return expect(result).to.eventually.become(newValidManifest)
  })

  it('should add manifest.vars field to final manifest if vars are defined in codiusvars but not in codius', async function () {
    const manifest = JSON.parse(JSON.stringify(manifestJson))
    delete manifest['manifest']['vars']
    await fse.writeJson(manifestMock, manifest)
    const result = generateManifest(varsMock, manifestMock)
    return expect(result).to.eventually.become(validManifest)
  })

  it('should not throw an error if the environment and vars fields are undefined', async function () {
    const manifest = JSON.parse(JSON.stringify(manifestJson))
    delete manifest['manifest']['containers'][0]['environment']
    delete manifest['manifest']['vars']
    await fse.writeJson(manifestMock, manifest)

    const vars = JSON.parse(JSON.stringify(varsJson))
    vars['vars']['public'] = {}
    vars['vars']['private'] = {}
    await fse.writeJson(varsMock, vars)

    const newValidManifest = JSON.parse(JSON.stringify(validManifest))
    delete newValidManifest['manifest']['vars']
    delete newValidManifest['private']
    delete newValidManifest['manifest']['containers'][0]['environment']
    const result = generateManifest(varsMock, manifestMock)
    return expect(result).to.eventually.become(newValidManifest)
  })

  it('should remove empty environment fields from containers in final manifest', async function () {
    const manifest = JSON.parse(JSON.stringify(manifestJson))
    manifest['manifest']['containers'][0]['environment'] = {}
    delete manifest['manifest']['vars']
    await fse.writeJson(manifestMock, manifest)

    const vars = JSON.parse(JSON.stringify(varsJson))
    vars['vars']['public'] = {}
    vars['vars']['private'] = {}
    await fse.writeJson(varsMock, vars)

    const newValidManifest = JSON.parse(JSON.stringify(validManifest))
    delete newValidManifest['manifest']['vars']
    delete newValidManifest['private']
    delete newValidManifest['manifest']['containers'][0]['environment']
    const result = generateManifest(varsMock, manifestMock)
    return expect(result).to.eventually.become(newValidManifest)
  })

  /*
  it('should produce an error if a container contains an invalid image', async function () {
    const manifest = JSON.parse(JSON.stringify(manifestJson))
    manifest['manifest']['containers'][0]['image'] = 'hello-world@1231984'
    await fse.writeJson(manifestMock, manifest)
    const result = generateManifest(varsMock, manifestMock)
    return expect(result).to.be.rejected
  })

  // Relies upon response from docker registry api to pass
  it('should resolve image tags to proper digest', async function () {
    const manifest = JSON.parse(JSON.stringify(manifestJson))
    manifest['manifest']['containers'][0]['image'] = 'nginx:1.15.0'
    await fse.writeJson(manifestMock, manifest)
    const result = generateManifest(varsMock, manifestMock)
    validManifest['manifest']['containers'][0]['image'] = `nginx@sha256:0946416199aca5c7bd2c3173f8a909b0873e9017562f1a445d061fce6664a049`
    return expect(result).to.eventually.become(validManifest)
  })

  it('should not update image hash if digest is already specified', async function () {
    const manifest = JSON.parse(JSON.stringify(manifestJson))
    manifest['manifest']['containers'][0]['image'] = 'nginx@sha256:0946416199aca5c7bd2c3173f8a909b0873e9017562f1a445d061fce6664a049'
    await fse.writeJson(manifestMock, manifest)
    const result = generateManifest(varsMock, manifestMock)
    validManifest['manifest']['containers'][0]['image'] = `nginx@sha256:0946416199aca5c7bd2c3173f8a909b0873e9017562f1a445d061fce6664a049`
    return expect(result).to.eventually.become(validManifest)
  })
  */
})
