function Authorization (userName, sessionId) {
    this.userName = userName;
    this.sessionId = sessionId;
}

Authorization.prototype.toEncodedString = function () {
    var authString = JSON.stringify(this);
    var authUtfBuffer = new Buffer(authString, 'utf8');
    return authUtfBuffer.toString('base64');
};

exports.create = function (userName, sessionId) {
    return new Authorization(userName, sessionId);
};

exports.parse = function (base64AuthString) {
    var authorizationBuffer = new Buffer(base64AuthString, 'base64');
    var authString = authorizationBuffer.toString('utf8');
    try {
        var authLiteral = JSON.parse(authString);
        return new Authorization(authLiteral.userName, authLiteral.sessionId);
    } catch (err) {
        return null;
    }
};
