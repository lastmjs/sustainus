const { spawn } = require('child_process');
const fs = require('fs');
const readline = require('readline');
import {
    USDCents,
    ReduxStore,
    Project,
    State,
    Milliseconds
} from '../index.d.ts';
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
const nodeFetch = require('node-fetch');

export async function checkForUpToDateNPMVersion(Store: Readonly<ReduxStore>) {
    const installedVersion: string = await getInstalledNPMVersion();

    Store.dispatch({
        type: 'SET_INSTALLED_VERSION',
        installedVersion
    });

    const publishedVersion: string = await getPublishedNPMVersion();

    if (installedVersion === publishedVersion) {
        Store.dispatch({
            type: 'SET_INSTALLED_VERSION_OUT_OF_DATE',
            installedVersionOutOfDate: false
        });
    }
    else {
        Store.dispatch({
            type: 'SET_INSTALLED_VERSION_OUT_OF_DATE',
            installedVersionOutOfDate: true
        });
    }
}

let searching = false;

export async function checkIfSearchNecessary(Store: Readonly<ReduxStore>) {
    const state: Readonly<State> = Store.getState();

    const oneMinuteInMilliseconds: Milliseconds = 60000;
    const oneHourInMilliseconds: Milliseconds = 60 * oneMinuteInMilliseconds;
    const oneDayInMilliseconds: Milliseconds = 24 * oneHourInMilliseconds;

    if (
        state.lastProjectSearchDate === 'NEVER' &&
        searching === false
    ) {
        searching = true;

        Store.dispatch({
            type: 'SET_SEARCH_STATE',
            searchState: 'SEARCHING'
        });

        await searchForVerifiedProjects(Store);

        Store.dispatch({
            type: 'SET_LAST_PROJECT_SEARCH_DATE',
            lastProjectSearchDate: new Date().getTime()
        });

        Store.dispatch({
            type: 'SET_SEARCH_STATE',
            searchState: 'NOT_SEARCHING'
        });

        searching = false;

        return;
    }

    if (
        state.lastProjectSearchDate !== 'NEVER' &&
        new Date().getTime() > state.lastProjectSearchDate + oneDayInMilliseconds &&
        searching === false
    ) {
        searching = true;

        Store.dispatch({
            type: 'SET_SEARCH_STATE',
            searchState: 'SEARCHING'
        });

        await searchForVerifiedProjects(Store);

        Store.dispatch({
            type: 'SET_LAST_PROJECT_SEARCH_DATE',
            lastProjectSearchDate: new Date().getTime()
        });

        Store.dispatch({
            type: 'SET_SEARCH_STATE',
            searchState: 'NOT_SEARCHING'
        });

        searching = false;
    }
}

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

export async function getInstalledNPMVersion() {
    const response = await window.fetch('package.json');
    const responseJSON = await response.json();

    return responseJSON.version;
}

export async function getPublishedNPMVersion() {
    // TODO I am only using nodeFetch here to get around CORS restrictions...apparently the registry API has not enabled CORS
    const response = await nodeFetch('https://registry.npmjs.com/sustainus');
    const responseJSON = await response.json();

    return responseJSON['dist-tags'].latest;
}