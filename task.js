'use strict';

const WSPublish = require('./task/wspublish.js');

function getInput(name, required) {
  var inval = process.env['INPUT_' + name.replace(' ', '_').toUpperCase()];
  if (inval) {
    inval = inval.trim();
  }
  if (required && !inval) {
    process.exit(1); 
  }
  console.log(name + '=' + inval);
  return inval;
}

let clientId = getInput('clientId', true);
let clientSecret = getInput('clientSecret', true);
let tenantId = getInput('tenantId', true);
let appId = getInput('appId', true);
let deploymentTarget = getInput('deploymentTarget', true);
let packagesSource = getInput('packagesSource', true);
let flightName = getInput('flightName', deploymentTarget == 'PF');

let pub = new WSPublish({
  clientId: clientId,
  clientSecret: clientSecret,
  tenantId: tenantId,
  appId: appId,
  flightName: flightName
});
pub.setDrop(packagesSource);

// start submission
pub.submission();

