#!/usr/bin/env node

(async () => {

    const spawn = require('child_process').spawn;
    const pathToApp = require.resolve('sustainus/app.js');
    const pathToSustainus = pathToApp.replace('/app.js', '');
    const fkill = require('fkill');

    console.log('pathToApp', pathToApp);
    console.log('pathToSustainus', pathToSustainus);
    
    await fkill('SUSTAINUS', {
        silent: true
    });
    await fkill(':10000', {
        silent: true
    });
    await fkill(':10001', {
        silent: true
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
})();
