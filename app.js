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

    window.loadFile('index.html');
})();
