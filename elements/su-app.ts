import { 
    html,
    render as litRender,
    TemplateResult
} from 'lit-html';
import { prepareStore } from '../services/store.ts';
import {
    searchForVerifiedProjects,
    getPayoutTransactionData
} from '../services/utilities.ts';
import {
    State,
    Project,
    Milliseconds,
    ReduxStore
} from '../index';
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
                        margin-left: auto;
                        margin-right: auto;
                        background-color: white;
                        padding: calc(25px + 1vmin);
                        min-height: 100%;
                        box-shadow: 0px 0px 4px black;
                    }
                </style>

                <div class="su-app-container">
                    <h1>Sustainus Alpha</h1>

                    <div>* Windows is not yet supported</div>

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
                    
                    <h2>Verified Projects</h2>
                    
                    <div>${state.searchState === 'NOT_SEARCHING' ? 'Search complete' : 'Searching...'}</div>
        
                    <br>

                    ${Object.values(state.projects).length !== 0 ? Object.values(state.projects).map((project: Readonly<Project>) => {
                        return html`
                            <div>Name: ${project.name}</div>
                            ${project.ethereumAddress !== 'NOT_SET' ? html`<div>Ethereum address: ${project.ethereumAddress}</div>` : ''}
                            ${project.ethereumName !== 'NOT_SET' ? html`<div>Ethereum name: ${project.ethereumName}</div>` : ''}
                            <div>Last payout: ${project.lastPayoutDateInMilliseconds === 'NEVER' ? 'never' : html`<a href="https://ropsten.etherscan.io/tx/${project.lastTransactionHash}" target="_blank">${new Date(project.lastPayoutDateInMilliseconds).toLocaleDateString()}</a>`}</div>
                            <br>
                        `;
                    }) : html`<div>No verified projects found</div>`}
                    
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
});
