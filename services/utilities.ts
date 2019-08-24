const { spawn } = require('child_process');
const fs = require('fs');
const readline = require('readline');
import {
    USDCents,
    CryptonatorETHPriceAPIEndpoint,
    EtherscanETHPriceAPIEndpoint,
    USD,
    ReduxStore
} from '../index';

export function searchForVerifiedProjects(Store: Readonly<ReduxStore>) {
    return new Promise((resolve) => {
        const finderProcess = spawn('find', ['/', '-name', 'package.json']); // global search
        // const finderProcess = spawn('find', ['.', '-name', 'package.json']); // local search
    
        finderProcess.on('close', () => {
            resolve();
        });
    
        // finderProcess.on('message', (e) => {
        //     console.log(e);
        // });
    
        const rl = readline.createInterface({
            input: finderProcess.stdout
        });
    
        rl.on('line', (line: string) => {
            // console.log(e)
    
            try {
            
                const fileContents = fs.readFileSync(line);
            
                // console.log('fileContents', fileContents.toString());
            
                const json = JSON.parse(fileContents.toString());
            
                if (json.ethereum) {
    
                    const ethereumAddress = json.ethereum.match(/.*(( |^).*\.eth)/) === null ? json.ethereum : 'NOT_SET';
                    const ethereumName = json.ethereum.match(/.*(( |^).*\.eth)/) !== null ? json.ethereum : 'NOT_SET';

                    console.log(json);
    
                    Store.dispatch({
                        type: 'ADD_PROJECT',
                        project: {
                            name: json.name,
                            ethereumAddress,
                            ethereumName
                        }
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