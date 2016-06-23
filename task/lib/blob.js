'use strict';

const Q = require('q')
    , fs = require('fs')
    , request = require('request')
class Blob{
  fix(path){
    let url = path.split('?');
    let query = url[1].split('&');
    let qs = query.map(p => {
      if(!p.startsWith('sig=')) return p;
      return 'sig=' + encodeURIComponent(p.substr(4))
    }).join('&');
    return `${url[0]}?${qs}`
  }

  put(sas, path){
    let deferred = Q.defer();
    let fileSize = fs.statSync(path)['size'];
    let headers = {
      'Content-Type': 'application/octet-stream',
      'Content-Length': fileSize,
      'Date': (new Date()).toUTCString(),
      'x-ms-version': '2015-02-21',
      'x-ms-blob-type': 'BlockBlob',
      'x-blob-content-length': fileSize
    };
    let body = fs.createReadStream(path);
    request.put({url: this.fix(sas), headers: headers,body: body}, (err, resp, body) => {
      if(err) return deferred.reject(new Error(err));
      deferred.resolve({response: resp, body: body});
    });
    return deferred.promise;
  }
}

module.exports = new Blob();
