#!/usr/bin/env node

const spawn = require('child_process').spawn;
const pathToApp = require.resolve('sustainus/app.js');
spawn('electron', [pathToApp], {
    stdio: 'ignore',
    detached: true
}).unref();