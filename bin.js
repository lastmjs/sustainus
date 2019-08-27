#!/usr/bin/env node

(async () => {

    const spawn = require('child_process').spawn;
    const pathToApp = require.resolve('sustainus/app.js');
    const pathToSustainus = pathToApp.replace('/app.js', '');

    const childProcess = spawn('node_modules/.bin/electron', [pathToApp], {
        stdio: 'ignore',
        detached: true,
        cwd: pathToSustainus
    }).unref();
    
    // childProcess.stdout.on('data', (data) => {
    //     console.log(data.toString());
    // });
    
    // childProcess.stderr.on('data', (data) => {
    //     console.log(data.toString());
    // })
})();
