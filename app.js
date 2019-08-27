process.title = 'SUSTAINUS';

const { app, BrowserWindow } = require('electron');
const spawn = require('child_process').spawn;
const AutoLaunch = require('auto-launch');

const autoLaunch = new AutoLaunch({
    name: 'Sustainus',
    path: `${__dirname}/bin.js`,
    // isHidden: true // TODO Figure out a good way to do this, it would be nice for the user to know that this is running even if it is hidden
});

autoLaunch.enable();

(async () => {
    await new Promise((resolve) => app.on('ready', () => resolve()));

    // app.setLoginItemSettings({
    //     openAtLogin: true,
    //     // path: `${__dirname}/bin.js`
    // });

    let window = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            experimentalFeatures: true
        },
        
    });

    window.maximize();

    await startLocalServer(10000);

    // TODO we should probably maintain a public page at index.html that directs users to install the app
    // TODO we might be able to solve the updating issue by loading the app from sustainus.io/sustainus.html...we'll have to see how that works
    if (process.env.NODE_ENV === 'development') {
        window.loadURL('http://localhost:10000/sustainus.html');
        // window.loadFile('./sustainus.html');
        window.webContents.openDevTools();
    }
    else {
        window.loadURL('http://localhost:10000/sustainus.html');
        // window.loadURL('https://sustainus.io');
        // window.loadFile('./dist/index.html');
    }

    window.on('close', (e) => {
        e.preventDefault();

        window.hide();
    });

    function startLocalServer(localPort, filename, serveDir) {
        return new Promise((resolve, reject) => {
            console.log('here i am')
            // const child = spawn(process.env.NODE_ENV === 'development' ? 'node_modules/.bin/zwitterion' : 'zwitterion', [
            const child = spawn(`${__dirname}/node_modules/.bin/zwitterion`, [
                '--port', localPort,
                '--watch-files',
                '--target', 'ES2015',
                '--disable-spa'
            ]);
    
            child.stdout.on('data', (chunk) => {
                console.log(chunk.toString());
                if (chunk.toString().includes('Zwitterion listening on port')) {
                    resolve(child);
                }
            });
    
            child.stderr.on('data', (chunk) => {
                console.log(chunk.toString());
            });
        });
    }

})();
