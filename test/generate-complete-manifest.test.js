const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const { expect } = chai
chai.use(chaiAsPromised)
const fse = require('fs-extra')
const { after, beforeEach, describe, it } = require('mocha')
const { generateCompleteManifest } = require('../src/generate-complete-manifest.js')
const validManifest = require('./mocks/manifest.test.json')
const varsStatic = './test/mocks/codiusvars.test.json'
const varsMock = './test/codiusvars.mock.json'
const manifestStatic = './test/mocks/codius.test.json'
const manifestMock = './test/mocks/codius.mock.json'
const varsJson = fse.readJsonSync(varsStatic)
const manifestJson = fse.readJsonSync(manifestStatic)

describe('Generate Complete Manifest', function () {
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
    const result = await generateCompleteManifest(varsStatic, manifestStatic)
    expect(result).to.deep.equal(validManifest)
  })

  it('should throw error if the codius manifest has schema errors', async function () {
    const manifest = JSON.parse(JSON.stringify(manifestJson))
    delete manifest['manifest']['name']
    await fse.writeJson(manifestMock, manifest)
    const result = generateCompleteManifest(varsMock, manifestMock)
    return expect(result).to.be.rejected
  })

  it('should throw error if codiusvars has schema errors', async function () {
    const vars = JSON.parse(JSON.stringify(manifestJson))
    delete vars['vars']
    await fse.writeJson(varsMock, vars)
    const result = generateCompleteManifest(varsMock, manifestMock)
    return expect(result).to.be.rejected
  })

  it('should override public vars that are already defined', async function () {
    const manifest = JSON.parse(JSON.stringify(manifestJson))
    manifest['manifest']['vars']['AWS_ACCESS_KEY'] = { value: 'ABSCEDADFSDSF' }
    await fse.writeJson(manifestMock, manifest)
    const result = generateCompleteManifest(varsMock, manifestMock)
    return expect(result).to.eventually.become(validManifest)
  })

  it('should create the public encoding for a private var if one does not already exist', async function () {
    const manifest = JSON.parse(JSON.stringify(manifestJson))
    delete manifest['manifest']['vars']['AWS_SECRET_KEY']
    await fse.writeJson(manifestMock, manifest)
    const result = generateCompleteManifest(varsMock, manifestMock)
    return expect(result).to.eventually.become(validManifest)
  })

  it('should override invalid public encodings for the private vars', async function () {
    const manifest = JSON.parse(JSON.stringify(manifestJson))
    manifest['manifest']['vars']['AWS_SECRET_KEY'] = {
      'encoding': 'private:sha256',
      'value': 'thisaninvalidhash'
    }
    await fse.writeJson(manifestMock, manifest)
    const result = generateCompleteManifest(varsMock, manifestMock)
    return expect(result).to.eventually.become(validManifest)
  })

  it('should remove all description fields from the final manifest', async function () {
    const manifest = JSON.parse(JSON.stringify(manifestJson))
    manifest['manifest']['vars']['AWS_SECRET_KEY']['description'] = 'An AWS secret key'
    manifest['manifest']['vars']['AWS_ACCESS_KEY']['description'] = 'An AWS access key'
    await fse.writeJson(manifestMock, manifest)
    const result = generateCompleteManifest(varsMock, manifestMock)
    return expect(result).to.eventually.become(validManifest)
  })
})
