const { spawn } = require('child_process');
const fs = require('fs');
const readline = require('readline');
import { Store } from './store.js';

export function searchForVerifiedProjects() {
    return new Promise((resolve) => {
        // const finderProcess = spawn('find', ['/', '-name', 'package.json']);
        const finderProcess = spawn('find', ['.', '-name', 'package.json']);
    
        finderProcess.on('close', () => {
            resolve();
        });
    
        // finderProcess.on('message', (e) => {
        //     console.log(e);
        // });
    
        const rl = readline.createInterface({
            input: finderProcess.stdout
        });
    
        rl.on('line', (line) => {
            // console.log(e)
    
            try {
            
                const fileContents = fs.readFileSync(line);
            
                // console.log('fileContents', fileContents.toString());
            
                const json = JSON.parse(fileContents.toString());
            
                if (json.ethereum) {
    
                    console.log(json);
    
                    Store.dispatch({
                        type: 'ADD_VERIFIED_PROJECT',
                        name: json.name,
                        ethereumAddress: json.ethereum
                    });
                    console.log(json.ethereum);
                }
    
                // console.log(json.ethereum);
            }
            catch(error) {
                console.log(error);
            }
    
        });
    
        // finderProcess.stdout.on('data', (data) => {
        //     // console.log(data.toString());
    
        //     // const fileContents = fs.readFileSync(data.toString());
    
        //     // console.log(fileContents);
        // });
    });

}