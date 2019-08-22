const {
    app,
    BrowserWindow
} = require('electron');

(async () => {
    await new Promise((resolve) => app.on('ready', () => resolve()));

    let window = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        }
    });

    // TODO we should probably maintain a public page at index.html that directs users to install the app
    // TODO we might be able to solve the updating issue by loading the app from sustainus.io/sustainus.html...we'll have to see how that works
    if (process.env.NODE_ENV === 'development') {
        // TODO use an http-server like zwitterion here instead
        window.loadFile('index.html');
    }
    else {
        window.loadURL('https://sustainus.io');
    }

})();
