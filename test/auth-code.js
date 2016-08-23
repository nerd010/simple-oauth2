'use strict';

const path = require('path');
const qs = require('querystring');
const nock = require('nock');
const expect = require('chai').expect;
const oauth2Module = require('./../index.js');

const oauth2 = oauth2Module(require('./fixtures/oauth-options'));

const tokenParams = {
  code: 'code',
  redirect_uri: 'http://callback.com',
};
const oauthParams = {
  code: 'code',
  redirect_uri: 'http://callback.com',
  grant_type: 'authorization_code',
  client_id: 'client-id',
  client_secret: 'client-secret',
};
const authorizeConfig = {
  redirect_uri: 'http://localhost:3000/callback',
  scope: 'user',
  state: '02afe928b',
};

describe('oauth2.authCode', function () {
  let request;
  let result;
  let resultPromise;
  let error;
  let errorPromise;

  describe('#authorizeURL', function () {
    it('returns the authorization URI', function () {
      result = oauth2.authCode.authorizeURL(authorizeConfig);

      const expected = `https://example.org/oauth/authorize?redirect_uri=${encodeURIComponent('http://localhost:3000/callback')}&scope=user&state=02afe928b&response_type=code&client_id=client-id`;
      expect(result).to.be.equal(expected);
    });

    it('should allow absolute URI for authorizationPath', function () {
      const oauth2Temp = oauth2Module({
        clientID: 'client-id',
        clientSecret: 'client-secret',
        site: 'https://example.org',
        authorizationPath: 'https://othersite.com/oauth/authorize',
      });
      result = oauth2Temp.authCode.authorizeURL(authorizeConfig);

      const expected = `https://othersite.com/oauth/authorize?redirect_uri=${encodeURIComponent('http://localhost:3000/callback')}&scope=user&state=02afe928b&response_type=code&client_id=client-id`;
      expect(result).to.be.equal(expected);
    });
  });

  describe('#getToken', function () {
    beforeEach(function () {
      request = nock('https://example.org')
        .post('/oauth/token', qs.stringify(oauthParams))
        .times(2)
        .replyWithFile(200, path.join(__dirname, '/fixtures/access_token.json'));
    });

    beforeEach(function (done) {
      oauth2.authCode.getToken(tokenParams, function (e, r) {
        error = e; result = r; done();
      });
    });

    beforeEach(function () {
      return oauth2.authCode
        .getToken(tokenParams)
        .then(function (r) { resultPromise = r; })
        .catch(function (e) { errorPromise = e; });
    });

    it('makes the HTTP request', function () {
      expect(request.isDone()).to.be.equal(true);
    });

    it('returns an access token as result of the token request', function () {
      expect(result).to.have.property('access_token');
      expect(resultPromise).to.have.property('access_token');
    });
  });
});
