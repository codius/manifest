const addErrorMessage = function (errors, field, message) {
  let error = {}
  error[field] = message
  return errors.push(error)
}
exports.addErrorMessage = addErrorMessage
