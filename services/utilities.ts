const { spawn } = require('child_process');
const fs = require('fs');
const readline = require('readline');
import {
    USDCents,
    CryptonatorETHPriceAPIEndpoint,
    EtherscanETHPriceAPIEndpoint,
    USD,
    ReduxStore,
    Project,
    State
} from '../index';
import { 
    EthereumTransactionDatum,
    ethersProvider,
    EthereumAddress,
    WEI,
    getGasLimit,
    getSafeLowGasPriceInWEI,
    convertUSDCentsToWEI,
    fetchETHPriceInUSDCents
} from '../elements/donation-wallet.ts';
import BigNumber from 'bignumber.js';

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
                            ethereumName,
                            lastPayoutDateInMilliseconds: 'NEVER',
                            lastTransactionHash: 'NOT_SET'
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

export async function getPayoutTransactionData(state: Readonly<State>): Promise<ReadonlyArray<EthereumTransactionDatum>> {
    const projects: ReadonlyArray<Project> = Object.values(state.projects);

    console.log('projects', projects);

    const ethPriceInUSDCents: USDCents | 'UNKNOWN' = await fetchETHPriceInUSDCents();

    if (ethPriceInUSDCents === 'UNKNOWN') {
        throw new Error('ethPriceInUSDCents is unknown');
    }

    const payoutTargetWEI: WEI = convertUSDCentsToWEI(state.payoutTargetUSDCents, ethPriceInUSDCents);

    console.log('payoutTargetWEI', payoutTargetWEI);

    const payoutTransactionData: ReadonlyArray<EthereumTransactionDatum> = await Promise.all(projects.map(async (project: Readonly<Project>) => {
        const ethereumAddress: EthereumAddress = project.ethereumAddress !== 'NOT_SET' ? project.ethereumAddress : await ethersProvider.resolveName(project.ethereumName);
        
        const data = '0x0';
        const grossValue: WEI = new BigNumber(payoutTargetWEI).dividedBy(projects.length).toFixed(0);

        const gasPrice: WEI = await getSafeLowGasPriceInWEI();
        const gasLimit: number = await getGasLimit(data, ethereumAddress, '0');

        const netValue: WEI = new BigNumber(grossValue).minus(new BigNumber(gasPrice).multipliedBy(gasLimit)).toFixed(0);

        return {
            id: project.name,
            to: ethereumAddress,
            value: netValue,
            data: '0x0',
            gasLimit,
            gasPrice
        };
    }));

    console.log('payoutTransactionData', payoutTransactionData);

    return payoutTransactionData.filter((transactionDatum: Readonly<EthereumTransactionDatum>) => {
        return new BigNumber(transactionDatum.value).isGreaterThan(0);
    });
}