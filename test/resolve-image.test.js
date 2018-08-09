/* eslint-env mocha */
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const { expect } = chai
chai.use(chaiAsPromised)
const { resolveImage } = require('../src/resolve-image.js')
const sinon = require('sinon')
const axios = require('axios')

describe('Resolve Docker Image', function () {
  // NOTE: The following tests rely on a response from the docker api v2
  beforeEach(function () {
    this.timeout(5000)
    this.sinon = sinon.createSandbox()
    this.get = this.sinon.stub(axios, 'get')
  })

  afterEach(function () {
    this.sinon.restore()
  })

  it('should not modify an image with a valid digest', function () {
    const image = 'nginx@sha256:62a095e5da5f977b9f830adaf64d604c614024bf239d21068e4ca826d0d629a4'
    const resolvedImage = resolveImage(image)
    return expect(resolvedImage).to.eventually.equal(image)
  })

  it('should resolve image with version tag', function () {
    const image = 'nginx:1.14.0'
    const manifestUrl = 'https://registry-1.docker.io/v2/library/nginx/manifests/1.14.0'
    this.get.withArgs(manifestUrl).returns({
      headers: {
        'docker-content-digest': 'sha256:62a095e5da5f977b9f830adaf64d604c614024bf239d21068e4ca826d0d629a4'
      }
    })
    this.get.callThrough()

    const expected = 'nginx@sha256:62a095e5da5f977b9f830adaf64d604c614024bf239d21068e4ca826d0d629a4'
    const resolvedImage = resolveImage(image)
    return expect(resolvedImage).to.eventually.equal(expected)
  })

  it('should throw error if image tag is invalid', function () {
    const image = 'nginx:1214256'
    const manifestUrl = 'https://registry-1.docker.io/v2/library/nginx/manifests/1214256'
    this.get.withArgs(manifestUrl).throws('Error: Request failed with status code 404')
    this.get.callThrough()
    const resolvedImage = resolveImage(image)
    return expect(resolvedImage).to.be.rejectedWith('Unable to get manifest info from registry.')
  })

  it('should resolve image with the tag latest', function () {
    const image = 'androswong418/betty:latest'
    const manifestUrl = 'https://registry-1.docker.io/v2/androswong418/betty/manifests/latest'
    this.get.withArgs(manifestUrl).returns({
      headers: {
        'docker-content-digest': 'sha256:62a095e5da5f977b9f830adaf64d604c614024bf239d21068e4ca826d0d629a4'
      }
    })
    this.get.callThrough()

    const expected = 'androswong418/betty@sha256:62a095e5da5f977b9f830adaf64d604c614024bf239d21068e4ca826d0d629a4'
    const resolvedImage = resolveImage(image)
    return expect(resolvedImage).to.eventually.equal(expected)
  })
})
