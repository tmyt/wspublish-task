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
    this.packagesInfo = packages;
    console.log(files);
  }

  buildPackageInfo(target, i){
    return this.getSubmission(target, i)
      .then(x => {
        let updatePackageFilter = this.files.map(x => path.basename(x.split('_')[0]) + '_')
          .filter((x, i, self) => self.indexOf(x) === i);
        for(let i = 0; i < x.length; ++i){
          if(!updatePackageFilter.some(f => x[i].fileName.startsWith(f))) continue;
          x[i].fileStatus = 'PendingDelete';
        }
        return this.packagesInfo.concat(x);
      });
  }

  getSubmission(target, i){
    if(target == 'PF'){
      return this.ws.getFlightSubmission(this.appId, i.flightId, i.id)
        .then(x => x.flightPackages);
    }
    return this.ws.getSubmission(this.appId, i.id)
      .then(x => x.applicationPackages);
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
    return this.buildPackageInfo(target, i)
      .then(list => {
        if(target == 'PF'){
          return this.ws.updateFlightSubmission(this.appId, i.flightId, i.id, { flightPackages: list });
        }
        return this.ws.updateSubmission(this.appId, i.id, { applicationPackages: list });
      })
      .then(_ => i);
  }

  commitSubmission(target, i){
    if(target == 'PF'){
      return this.ws.commitFlightSubmission(this.appId, i.flightId, i.id);
    }
    return this.ws.commitSubmission(this.appId, i.id);
  }

  submission(target){
    let pkg = Package.tmpFile();
    return Package.generatePackagesZip(this.files, pkg)
      .then(_ => this.createSubmission(target))
      .then(x => Blob.put(x.fileUploadUrl, pkg).then(_ => x))
      .then(x => this.updateSubmission(target, x))
      .then(x => this.commitSubmission(target, x).then(_ => x))
      .then(x => this.getSubmission(target, x))
      .then(console.log).catch(console.log)
      .then(x => Package.removeFile(pkg))
      .then(console.log).catch(console.log)
  }
}

module.exports = WSPublish;
