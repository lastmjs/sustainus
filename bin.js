#!/usr/bin/env node

const spawn = require('child_process').spawn;
const pathToApp = require.resolve('sustainus/app.js');
console.log('pathToApp', pathToApp);
const childProcess = spawn('electron', [pathToApp], {
});
// const childProcess = spawn('electron', [pathToApp], {
//     stdio: 'ignore',
//     detached: true
// }).unref();


childProcess.stdout.on('data', (data) => {
    console.log(data.toString());
});

childProcess.stderr.on('data', (data) => {
    console.log(data.toString());
})