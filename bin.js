#!/usr/bin/env node

const spawn = require('child_process').spawn;
const pathToApp = process.env.NODE_ENV === 'development' ? 'app.js' : require.resolve('sustainus/app.js');
const pathToSustainus = process.env.NODE_ENV === 'development' ? './' : pathToApp.replace('/app.js', '');
const fkill = require('fkill');

createElectronProcess();

function createElectronProcess() {
    const childProcess = spawn('node_modules/.bin/electron', [pathToApp], {
        // stdio: 'ignore',
        // detached: true,
        cwd: pathToSustainus
    });

    // TODO we might want to be more sophisticated with reading data from the child...perhaps using readline or some other delimiter
    // TODO we want to make it cross-platform though
    childProcess.stdout.on('data', async (data) => {
        // if (data.includes('SUSTAINUS_RESTART')) {

        //     // we need to make sure to kill Zwitterion
        //     await fkill(':10000', {
        //         silent: true
        //     });

        //     await fkill(':10001', {
        //         silent: true
        //     });

        //     createElectronProcess();
        //     process.exit(0);
        // }

        // TODO we should clean all of this up...for some reason this is working without the SUSTAINUS_RESTART, but I do not know why
        if (data.includes('SUSTAINUS_DO_NOTHING')) {
            // we need to make sure to kill Zwitterion
            await fkill(':10000', {
                silent: true
            });

            await fkill(':10001', {
                silent: true
            });

            process.exit(0);
        }
    });

    // childProcess.stderr.on('data', (data) => {
    //     console.log(data.toString());
    // });
}