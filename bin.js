#!/usr/bin/env node

const spawn = require('child_process').spawn;
const pathToApp = require.resolve('sustainus/app.js');
console.log('pathToApp', pathToApp);
spawn('electron', [pathToApp]);