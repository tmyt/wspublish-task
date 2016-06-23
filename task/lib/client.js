'use strict';

const Q = require('q')
    , request = require('request')

const Base = 'https://manage.devcenter.microsoft.com/v1.0/my/applications';

function r(opts){
  let deferred = Q.defer();
  request(opts, (err, resp, body) => {
    if(err) return deferred.reject(new Error(err));
    deferred.resolve({response: resp, body: body});
  });
  return deferred.promise;
}

class Client{
  constructor(opts){
    this.clientId = opts.clientId;
    this.clientSecret = opts.clientSecret;
    this.tenantId = opts.tenantId;
    this.token = null;
  }

  authenticate(){
    console.log('[] authenticate');
    if(this.token) return Q(this.token);
    return r({
      method: 'POST',
      url: `https://login.microsoftonline.com/${this.tenantId}/oauth2/token`,
      form: {
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        resource: 'https://manage.devcenter.microsoft.com'
      }
    }).then(x => {
      let obj = JSON.parse(x.body);
      console.log(obj.access_token);
      return this.token = obj.access_token;
    });
  }

  get(url){
    return this.request('GET', url);
  }

  post(url, form){
    return this.request('POST', url, {form: form});
  }

  put(url, data){
    return this.request('PUT', url, {body: data, json: true});
  }

  request(method, url, form){
    console.log(`[] request: ${method}, ${url}`);
    return this.authenticate().then(token => r({
      method: method,
      url: url,
      form: (form||{}).form,
      body: (form||{}).body,
      json: (form||{}).json,
      headers: { Authorization: `Bearer ${token}` }
    }));
  }

  applications(){
    return this.get(`${Base}`);
  }

  applicationFlights(appId){
    return this.get(`${Base}/${appId}/listflights`)
      .then(x => JSON.parse(x.body));
  }

  createSubmission(appId){
    return this.post(`${Base}/${appId}/submissions`)
      .then(x => JSON.parse(x.body));
  }

  updateSubmission(appId, submissionId, params){
    return this.put(`${Base}/${appId}/submissions/${submissionId}`, params)
      .then(x => x.body);
  }

  commitSubmission(appId, submissionId){
    return this.post(`${Base}/${appId}/submissions/${submissionId}/commit`, {})
      .then(x => JSON.parse(x.body));
  }

  createFlightSubmission(appId, flightId){
    return this.post(`${Base}/${appId}/flights/${flightId}/submissions`)
      .then(x => JSON.parse(x.body));
  }

  updateFlightSubmission(appId, flightId, submissionId, params){
    return this.put(`${Base}/${appId}/flights/${flightId}/submissions/${submissionId}`, params)
      .then(x => x.body);
  }

  commitFlightSubmission(appId, flightId, submissionId){
    return this.post(`${Base}/${appId}/flights/${flightId}/submissions/${submissionId}/commit`, {})
      .then(x => JSON.parse(x.body));
  }

  getFlightSubmission(appId, flightId, submissionId){
    return this.get(`${Base}/${appId}/flights/${flightId}/submissions/${submissionId}`)
      .then(x => JSON.parse(x.body));
  }
}

module.exports = Client;
