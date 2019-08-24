import { 
    html,
    render as litRender,
    TemplateResult
} from 'lit-html';
import { prepareStore } from '../services/store.ts';
import {
    searchForVerifiedProjects
} from '../services/utilities.ts';
import {
    State,
    Project,
    Milliseconds,
    ReduxStore
} from '../index';
import {
    DonationWallet,
    createWallet
} from './donation-wallet.ts';
import { get } from 'idb-keyval';

// TODO we must type the store
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
    
        render(state: Readonly<State>): Readonly<TemplateResult> {
            console.log('state', state);
            return html`
                <h1>Sustainus Alpha</h1>

                <h2>Wallet</h2>

                <donation-wallet
                    .payoutTargetUSDCents=${state.payoutTargetUSDCents}
                    .payoutIntervalDays=${state.payoutIntervalDays}
                    .lastPayoutDateMilliseconds=${state.lastPayoutDateMilliseconds}
                    @payout-target-usd-cents-changed=${(e: any) => this.payoutTargetUSDCentsChanged(e)}
                    @payout-interval-days-changed=${(e: any) => this.payoutIntervalDaysChanged(e)}
                ></donation-wallet>
                
                <h2>Verified Projects</h2>
                
                <div>${state.searchState === 'NOT_SEARCHING' ? 'Search complete' : 'Searching...'}</div>
    
                <br>

                ${Object.values(state.projects).length !== 0 ? Object.values(state.projects).map((project: Readonly<Project>) => {
                    return html`
                        <div>Name: ${project.name}</div>
                        ${project.ethereumAddress !== 'NOT_SET' ? html`<div>Ethereum address: ${project.ethereumAddress}</div>` : ''}
                        ${project.ethereumName !== 'NOT_SET' ? html`<div>Ethereum name: ${project.ethereumName}</div>` : ''}
                    `;
                }) : html`<div>No verified projects found</div>`}
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
