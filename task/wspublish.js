'use strict';

const WSClient = require('./lib/client.js')
    , Blob = require('./lib/blob.js')
    , Package = require('./lib/package.js')
    , path = require('path')

class WSPublish{
  constructor(opts){
    this.ws = new WSClient({
      clientId: opts.clientId,
      clientSecret: opts.clientSecret,
      tenantId: opts.tenantId
    });
    this.appId = opts.appId;
    this.flightName = opts.flightName;
  }

  setDrop(dir){
    let files = Package.findFiles(dir, '.appxupload');
    let packages = files.map(s => {
      return {fileName: s, fileStatus: 'PendingUpload'};
    });
    this.files = files.map(s => path.join(dir, s));
    this.flightInfo = {
      flightPackages: packages
    };
    console.log(files);
  }

  createSubmission(target){
    if(target == 'PF'){
      return this.ws.applicationFlights(this.appId)
        .then(x => x.value.find(y => y.friendlyName == this.flightName))
        .then(x => this.ws.createFlightSubmission(this.appId, x.flightId));
    }
    return this.ws.createSubmission(this.appId);
  }

  updateSubmission(target, i){
    if(target == 'PF'){
      return this.ws.updateFlightSubmission(this.appId, i.flightId, i.id, this.flightInfo)
        .then(_ => i);
    }
    return this.ws.updateSubmission(this.appId, i.id, {
      applicationPackages: this.flightInfo.flightPackages
    }).then(_ => i);
  }

  commitSubmission(target, i){
    if(target == 'PF'){
      return this.ws.commitFlightSubmission(this.appId, i.flightId, i.id))
    }
    return this.ws.commitSubmission(this.appId, i.id);
  }

  submission(target){
    let pkg = Package.tmpFile();
    return Package.generatePackagesZip(this.files, pkg)
      .then(_ => this.createSubmission(target))
      .then(x => Blob.put(x.fileUploadUrl, pkg).then(_ => x))
      .then(x => this.updateSubmission(target, x))
      .then(x => this.commitSubmission(target, x))
      .then(console.log).catch(console.log)
      .then(x => Package.removeFile(pkg))
      .then(console.log).catch(console.log)
  }
}

module.exports = WSPublish;
