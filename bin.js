#!/usr/bin/env node

const spawn = require('child_process').spawn;
const pathToApp = require.resolve('sustainus/app.js');
const pathToSustainus = pathToApp.replace('/app.js', '');

console.log('pathToApp', pathToApp);
console.log('pathToSustainus', pathToSustainus);

const killProcess = spawn('node_modules/.bin/fkill', ['SUSTAINUS_MAIN_PROCESS']);

killProcess.stdout.on('data', (data) => {
    console.log(data.toString());
});

killProcess.stderr.on('data', (data) => {
    console.log(data.toString());
});

const childProcess = spawn('node_modules/.bin/electron', [pathToApp], {
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