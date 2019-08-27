import { 
    html,
    render as litRender,
    TemplateResult
} from 'lit-html';
import { prepareStore } from '../services/store.ts';
import {
    searchForVerifiedProjects,
    getPayoutTransactionData,
    getInstalledNPMVersion,
    getPublishedNPMVersion
} from '../services/utilities.ts';
import {
    State,
    Project,
    Milliseconds,
    ReduxStore
} from '../index.d.ts';
import {
    DonationWallet,
    createWallet,
    EthereumTransactionDatum,
    pay
} from './donation-wallet.ts';

prepareStore().then((Store: Readonly<ReduxStore>) => {
    class SUApp extends HTMLElement {
        constructor() {
            super();
            Store.subscribe(() => litRender(this.render(Store.getState()), this));
        }
    
        async connectedCallback() {
            setTimeout(async () => {
                Store.dispatch({
                    type: 'RENDER'
                });

                if (Store.getState().walletCreationState === 'NOT_CREATED') {
                    const donationWallet: Readonly<DonationWallet> | null = this.querySelector('donation-wallet');

                    if (donationWallet === null) {
                        return;
                    }

                    donationWallet.addEventListener('creating-wallet', () => {
                        Store.dispatch({
                            type: 'SET_WALLET_CREATION_STATE',
                            walletCreationState: 'CREATING'
                        })
                    });

                    donationWallet.addEventListener('wallet-created', () => {
                        Store.dispatch({
                            type: 'SET_WALLET_CREATION_STATE',
                            walletCreationState: 'CREATED'
                        })
                    });

                    createWallet(donationWallet);
                }
            }, 0);
        }

        payoutTargetUSDCentsChanged(e: any) {
            Store.dispatch({
                type: 'SET_PAYOUT_TARGET_USD_CENTS',
                payoutTargetUSDCents: e.detail.payoutTargetUSDCents
            });
        }

        payoutIntervalDaysChanged(e: any) {
            Store.dispatch({
                type: 'SET_PAYOUT_INTERVAL_DAYS',
                payoutIntervalDays: e.detail.payoutIntervalDays
            });
        }

        // TODO put in the retry stuff
        async payout() {
            const transactionData: ReadonlyArray<EthereumTransactionDatum> = await getPayoutTransactionData(Store.getState());
        
            const donationWallet: Readonly<DonationWallet> | null = this.querySelector('donation-wallet');

            console.log('donationWallet', donationWallet);

            if (donationWallet === null) {
                return;
            }

            await pay(donationWallet, transactionData);

            Store.dispatch({
                type: 'SET_LAST_PAYOUT_DATE_MILLISECONDS',
                lastPayoutDateMilliseconds: new Date().getTime()
            });
        }

        async transactionCompleted(e: any) {
            Store.dispatch({
                type: 'SET_PROJECT_LAST_PAYOUT_DATE_IN_MILLISECONDS',
                projectName: e.detail.id,
                lastPayoutDateInMilliseconds: new Date().getTime()
            });

            Store.dispatch({
                type: 'SET_PROJECT_LAST_TRANSACTION_HASH',
                projectName: e.detail.id,
                lastTransactionHash: e.detail.transactionHash
            });
        }
    
        render(state: Readonly<State>): Readonly<TemplateResult> {
            return html`
                <style>
                    html {
                        background-color: rgba(0, 0, 0, .1);
                        height: 100%;
                        width: 100%;
                    }

                    body {
                        height: 100%;
                        width: 100%;
                        margin: 0;
                    }

                    .su-app-container {
                        width: 50%;
                        margin-top: 5vh;
                        margin-bottom: 5vh;
                        margin-left: auto;
                        margin-right: auto;
                        background-color: white;
                        padding: calc(25px + 1vmin);
                        box-shadow: 0px 0px 4px black;
                    }

                    .su-app-title {
                        display: flex;
                        justify-content: center;
                        font-size: calc(25px + 1vmin);
                        font-weight: bold;
                        margin-bottom: calc(25px + 1vmin);
                    }

                    .su-app-subtitle {
                        font-weight: bold;
                        display: flex;
                        justify-content: center;
                        margin-bottom: calc(25px + 1vmin);
                        color: red;
                    }
                </style>

                <div class="su-app-container">
                    <div class="su-app-title">Sustainus Alpha v0.0.32</div>

                    ${state.installedVersionOutOfDate === true ? html`<div class="su-app-subtitle">Your installed version is out of date: npm i -g sustainus</div>` : ''}

                    <div>* Report bugs, issues, and feature requests to the <a href="https://t.me/sustainus" target="_blank">Telegram group</a> or <a href="https://github.com/lastmjs/sustainus" target="_blank">GitHub repo</a></div>
                    <div>* Windows is not yet supported</div>
                </div>

                <div class="su-app-container">                
                    <div class="su-app-title" style="cursor: help" title="A verified project has an Ethereum name or address in the ethereum field of its package.json file">Verified Projects</div>
                    
                    <div>${state.searchState === 'NOT_SEARCHING' ? `Next search scheduled for ${state.lastProjectSearchDate === 'NEVER' ? 'moments from now' : new Date(new Date(state.lastProjectSearchDate).getTime() + 60000 * 60 * 24)}` : 'Searching...'}</div>
        
                    <br>

                    ${Object.values(state.projects).length !== 0 ? Object.values(state.projects).map((project: Readonly<Project>) => {
                        return html`
                            <div>Name: ${project.name}</div>
                            ${project.ethereumAddress !== 'NOT_SET' ? html`<div>Ethereum address: ${project.ethereumAddress}</div>` : ''}
                            ${project.ethereumName !== 'NOT_SET' ? html`<div>Ethereum name: ${project.ethereumName}</div>` : ''}
                            <div>Last payout: ${project.lastPayoutDateInMilliseconds === 'NEVER' ? 'never' : html`<a href="https://${process.env.NODE_ENV === 'development' ? 'ropsten.' : ''}etherscan.io/tx/${project.lastTransactionHash}" target="_blank">${new Date(project.lastPayoutDateInMilliseconds).toLocaleDateString()}</a>`}</div>
                            <br>
                        `;
                    }) : html`<div>No verified projects found</div>`}
                    
                </div>


                <div class="su-app-container">
                    <donation-wallet
                        .payoutTargetUSDCents=${state.payoutTargetUSDCents}
                        .payoutIntervalDays=${state.payoutIntervalDays}
                        .lastPayoutDateMilliseconds=${state.lastPayoutDateMilliseconds}
                        @payout-target-usd-cents-changed=${(e: any) => this.payoutTargetUSDCentsChanged(e)}
                        @payout-interval-days-changed=${(e: any) => this.payoutIntervalDaysChanged(e)}
                        @pay-now=${() => this.payout()}
                        @transaction-completed=${(e: any) => this.transactionCompleted(e)}
                        @payout-interval-elapsed=${() => this.payout()}
                    ></donation-wallet>
                </div>
            `;
        }
    }
    
    window.customElements.define('su-app', SUApp);

    // TODO we should probably abstract away the repeated code in each of the functions
    // TODO we should put this somewhere special
    setInterval(async () => {
        const state: Readonly<State> = Store.getState();

        const oneMinuteInMilliseconds: Milliseconds = 60000;
        const oneHourInMilliseconds: Milliseconds = 60 * oneMinuteInMilliseconds;
        const oneDayInMilliseconds: Milliseconds = 24 * oneHourInMilliseconds;

        if (state.lastProjectSearchDate === 'NEVER') {
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

            return;
        }

        if (new Date().getTime() > state.lastProjectSearchDate + oneDayInMilliseconds) {
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
        }

    }, 30000);

    setInterval(async () => {
        const installedVersion: string = await getInstalledNPMVersion();
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
    }, 30000);
});
