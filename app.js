const { app, BrowserWindow } = require('electron');
const spawn = require('child_process').spawn;

(async () => {
    await new Promise((resolve) => app.on('ready', () => resolve()));

    let window = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            experimentalFeatures: true
        },
        
    });

    await startLocalServer(10000);

    // TODO we should probably maintain a public page at index.html that directs users to install the app
    // TODO we might be able to solve the updating issue by loading the app from sustainus.io/sustainus.html...we'll have to see how that works
    if (process.env.NODE_ENV === 'development') {
        window.loadURL('http://localhost:10000/sustainus.html');
        // window.loadFile('./sustainus.html');
        window.webContents.openDevTools();
    }
    else {
        window.loadURL('https://sustainus.io');
        // window.loadFile('./dist/index.html');
    }

    function startLocalServer(localPort, filename, serveDir) {
        return new Promise((resolve, reject) => {
            const child = spawn('node_modules/.bin/zwitterion', [
                '--port', localPort,
                '--watch-files',
                '--target', 'ES2015',
                '--disable-spa'
            ]);
    
            child.stdout.on('data', (chunk) => {
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
