#!/usr/bin/env node

const spawn = require('child_process').spawn;
const pathToApp = require.resolve('sustainus/app.js');
const pathToSustainus = pathToApp.replace('/app.js', '');

createElectronProcess();

function createElectronProcess() {
    const childProcess = spawn('node_modules/.bin/electron', [pathToApp], {
        // stdio: 'ignore',
        // detached: true,
        cwd: pathToSustainus
    });

    // TODO we might want to be more sophisticated with reading data from the child...perhaps using readline or some other delimiter
    // TODO we want to make it cross-platform though
    childProcess.stdout.on('data', (data) => {
        if (data.includes('SUSTAINUS_RESTART')) {
            createElectronProcess();
            process.exit(0);
        }

        if (data.includes('SUSTAINUS_DO_NOTHING')) {
            process.exit(0);
        }
    });

    // childProcess.stderr.on('data', (data) => {
    //     console.log(data.toString());
    // });

    // childProcess.on('message', (message) => {

    //     console.log('message', message);
    //     if (message === 'DO_NOTHING') {

    //     }

    //     if (message === 'TRY_AGAIN') {
    //         // createElectronProcess();
    //     }
    // });

}