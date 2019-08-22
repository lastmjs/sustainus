#!/usr/bin/env node

const spawn = require('child_process').spawn;

spawn('electron', ['app.js']);