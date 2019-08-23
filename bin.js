#!/usr/bin/env node

const spawn = require('child_process').spawn;
const pathToSustainus = require.resolve('sustainus');
const pathToApp = `${pathToSustainus}/app.js`;
console.log('pathToApp', pathToApp);
const childProcess = spawn('electron', [pathToApp], {
    cwd: pathToSustainus
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