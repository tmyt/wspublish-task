'use strict';

const fs = require('fs')
    , os = require('os')
    , path = require('path')
    , Zip = require('jszip')
    , Q = require('q')

class Package{
  generatePackagesZip(files, output){
    let zip = new Zip();
    for(let i = 0; i < files.length; ++i){
      let name = path.basename(files[i]);
      zip.file(name, fs.createReadStream(files[i]));
    }
    return zip.generateAsync({type: 'nodebuffer', platform: process.platform})
      .then(content => Q.nfcall(fs.writeFile, output, content))
  }

  findFiles(dir, ext){
    return fs.readdirSync(dir).filter(s => s.endsWith(ext));
  }

  tmpFile(){
    return path.join(os.tmpdir(), `${Date.now()}.zip`);
  }

  removeFile(path){
    return Q.nfcall(fs.unlink, path);
  }
}

module.exports = new Package();
