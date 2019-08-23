const { spawn } = require('child_process');
const fs = require('fs');
const readline = require('readline');

export async function fetchAndSetETHPriceInUSDCents(Store) {
    Store.dispatch({
        type: 'SET_ETH_PRICE_IN_USD_CENTS',
        ethPriceInUSDCents: 'FETCHING'
    });

    const currentETHPriceInUSDCents: USDCents | 'UNKNOWN' = new BigNumber(await getCurrentETHPriceInUSDCents()).toString();

    Store.dispatch({
        type: 'SET_ETH_PRICE_IN_USD_CENTS',
        currentETHPriceInUSDCents
    });
}

export function fetchETHBalanceInWEI() {

}

export async function getCurrentETHPriceInUSDCents(attemptNumber: number = 0): Promise<USDCents | 'UNKNOWN'> {
    // TODO do not use this api until reviewing and complying with the terms
    // TODO If we want a third backup, we could use this
    // window.fetch('https://api.coinbase.com/v2/exchange-rates?currency=ETH').then((result) => result.json()).then((result) => console.log(result))
    try {
        if (attemptNumber === 0) {
            return await getCryptonatorCurrentETHPriceInUSDCents();
        }

        if (attemptNumber === 1) {
            return await getEtherscanCurrentETHPriceInUSDCents();
        }

        return 'UNKNOWN';
    }
    catch(error) {
        console.log('getCurrentETHPriceInUSDCents error', error);
        return await getCurrentETHPriceInUSDCents(attemptNumber + 1);
    }
}

async function getCryptonatorCurrentETHPriceInUSDCents(): Promise<USDCents> {
    const ethPriceJSON: any = await getCurrentETHPriceJSON(cryptonatorAPIEndpoint);
    const currentETHPriceInUSD: USDollars = ethPriceJSON.ticker.price;
    const currentETHPriceInUSDCents: USDCents = new BigNumber(currentETHPriceInUSD).multipliedBy(100).toString();    
    return currentETHPriceInUSDCents;
}

async function getEtherscanCurrentETHPriceInUSDCents(): Promise<USDCents> {
    const ethPriceJSON: any = await getCurrentETHPriceJSON(etherscanAPIEndpoint);
    const currentETHPriceInUSD: USDollars = ethPriceJSON.result.ethusd;
    const currentETHPriceInUSDCents: USDCents = new BigNumber(currentETHPriceInUSD).multipliedBy(100).toString();
    return currentETHPriceInUSDCents;
}

async function getCurrentETHPriceJSON(apiEndpoint: CryptonatorETHPriceAPIEndpoint | EtherscanETHPriceAPIEndpoint) {
    const ethPriceResponse: Readonly<Response> = await window.fetch(apiEndpoint);
    const ethPriceJSON: any = await ethPriceResponse.json();
    return ethPriceJSON;
}

export function searchForVerifiedProjects(Store) {
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
    
        rl.on('line', (line) => {
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