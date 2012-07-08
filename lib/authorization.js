function Authorization (email, sessionId) {
  this.email = email;
  this.sessionId = sessionId;
}

Authorization.prototype.toEncodedString = function () {
  var authString = JSON.stringify(this);
  var authUtfBuffer = new Buffer(authString, 'utf8');
  return authUtfBuffer.toString('base64');
};

exports.create = function (email, sessionId) {
  return new Authorization(email, sessionId);
};

exports.parse = function (base64AuthString) {
  var authorizationBuffer = new Buffer(base64AuthString, 'base64');
  var authString = authorizationBuffer.toString('utf8');
  try {
    var authLiteral = JSON.parse(authString);
    return new Authorization(authLiteral.email, authLiteral.sessionId);
  } catch (err) {
    return null;
  }
};
