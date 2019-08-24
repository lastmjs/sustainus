// TODO this is meant to become its own component that is shared with Podcrypt
// TODO put the fetch and sets in the class
// TODO put the store in the class
// TODO make sure we can have multiple instances of these wallets if we need them
// TODO I think the donation wallet should have everything passed into it...the address, mnemonic phrase, and private key? I don't know if we really want to keep those in memory though...
// TODO but it would be nice if the consumer or the host had to take care of persistence and everything, might make it more modular and allow users to switch more easily between accounts
// TODO pass in all of the payout information, and have the wallet raise events when that information changes

import { 
    html,
    render as litRender,
    TemplateResult
} from 'lit-html';
import { 
    createStore
} from 'redux/es/redux.mjs';
import { Store } from 'redux';
import 'ethers/dist/ethers.min.js';
import { 
    set,
    get
} from 'idb-keyval';
import './donation-modal.ts';

declare var ethers: any;

type EthereumNetworkName = 'homestead' | 'ropsten';

const networkName: EthereumNetworkName = process.env.NODE_ENV === 'development' ? 'ropsten' : 'homestead';

export const ethersProvider = ethers.getDefaultProvider(networkName);

export type WalletCreationState = 'NOT_CREATED' | 'CREATING' | 'CREATED';

export type CryptonatorETHPriceAPIEndpoint = `https://api.cryptonator.com/api/ticker/eth-usd`;
export type EtherscanETHPriceAPIEndpoint = `https://api.etherscan.io/api?module=stats&action=ethprice`;

export type EthereumAddress = string;

type State = {
    ethBalanceInWEI: WEI | 'UNKNOWN';
    ethPriceInUSDCents: USDCents | 'UNKNOWN';
    payoutTargetUSDCents: USDCents | 'NOT_SET';
    payoutIntervalDays: Days | 'NOT_SET';
    lastPayoutDateMilliseconds: Milliseconds | 'NEVER';
    nextPayoutDateMilliseconds: Milliseconds | 'NEVER';
    showAcknowledgeMnemonicPhraseModal: boolean;
    showReceiveETHModal: boolean;
}

type RENDER = {
    readonly type: 'RENDER';
}

type SET_ETH_PRICE_IN_USD_CENTS = {
    readonly type: 'SET_ETH_PRICE_IN_USD_CENTS';
    readonly ethPriceInUSDCents: USDCents | 'UNKNOWN';
}

type SET_ETH_BALANCE_IN_WEI = {
    readonly type: 'SET_ETH_BALANCE_IN_WEI';
    readonly ethBalanceInWEI: WEI;
}

type SET_PAYOUT_INTERVAL_DAYS = {
    readonly type: 'SET_PAYOUT_INTERVAL_DAYS';
    readonly payoutIntervalDays: Days;
}

type SET_PAYOUT_TARGET_USD_CENTS = {
    readonly type: 'SET_PAYOUT_TARGET_USD_CENTS';
    readonly payoutTargetUSDCents: USDCents;
}

type SET_LAST_PAYOUT_DATE_MILLISECONDS = {
    readonly type: 'SET_LAST_PAYOUT_DATE_MILLISECONDS';
    readonly lastPayoutDateMilliseconds: Milliseconds | 'NEVER';
}

type SET_NEXT_PAYOUT_DATE_MILLISECONDS = {
    readonly type: 'SET_NEXT_PAYOUT_DATE_MILLISECONDS';
    readonly nextPayoutDateMilliseconds: Milliseconds;
}

type SET_SHOW_RECEIVE_ETH_MODAL = {
    readonly type: 'SET_SHOW_RECEIVE_ETH_MODAL';
    readonly showReceiveETHModal: boolean;
}

type SET_SHOW_ACKNOWLEDGE_MNEMONIC_PHRASE_MODAL = {
    readonly type: 'SET_SHOW_ACKNOWLEDGE_MNEMONIC_PHRASE_MODAL';
    readonly showAcknowledgeMnemonicPhraseModal: boolean;
}

type Actions = 
    SET_NEXT_PAYOUT_DATE_MILLISECONDS |
    SET_SHOW_ACKNOWLEDGE_MNEMONIC_PHRASE_MODAL |
    SET_SHOW_RECEIVE_ETH_MODAL |
    SET_LAST_PAYOUT_DATE_MILLISECONDS |
    SET_PAYOUT_TARGET_USD_CENTS |
    SET_PAYOUT_INTERVAL_DAYS |
    SET_ETH_BALANCE_IN_WEI |
    SET_ETH_PRICE_IN_USD_CENTS |
    RENDER;

type WEI = number;

type USD = number;
type USDCents = number;

type Days = number;
type Milliseconds = number;

const InitialState: Readonly<State> = {
    ethBalanceInWEI: 'UNKNOWN',
    ethPriceInUSDCents: 'UNKNOWN',
    payoutIntervalDays: 'NOT_SET',
    payoutTargetUSDCents: 'NOT_SET',
    lastPayoutDateMilliseconds: 'NEVER',
    nextPayoutDateMilliseconds: 'NEVER',
    showAcknowledgeMnemonicPhraseModal: false,
    showReceiveETHModal: false
};

function RootReducer(state: Readonly<State>=InitialState, action: Readonly<Actions>): Readonly<State> {

    if (action.type === 'SET_ETH_PRICE_IN_USD_CENTS') {
        return {
            ...state,
            ethPriceInUSDCents: action.ethPriceInUSDCents
        };
    }

    if (action.type === 'SET_ETH_BALANCE_IN_WEI') {
        return {
            ...state,
            ethBalanceInWEI: action.ethBalanceInWEI
        };
    }

    if (action.type === 'SET_LAST_PAYOUT_DATE_MILLISECONDS') {
        return {
            ...state,
            lastPayoutDateMilliseconds: action.lastPayoutDateMilliseconds
        };
    }

    if (action.type === 'SET_PAYOUT_INTERVAL_DAYS') {
        return {
            ...state,
            payoutIntervalDays: action.payoutIntervalDays
        };
    }

    if (action.type === 'SET_PAYOUT_TARGET_USD_CENTS') {
        return {
            ...state,
            payoutTargetUSDCents: action.payoutTargetUSDCents
        };
    }

    if (action.type === 'SET_SHOW_RECEIVE_ETH_MODAL') {
        return {
            ...state,
            showReceiveETHModal: action.showReceiveETHModal
        };
    }

    if (action.type === 'SET_SHOW_ACKNOWLEDGE_MNEMONIC_PHRASE_MODAL') {
        return {
            ...state,
            showAcknowledgeMnemonicPhraseModal: action.showAcknowledgeMnemonicPhraseModal
        };
    }

    if (action.type === 'SET_NEXT_PAYOUT_DATE_MILLISECONDS') {
        return {
            ...state,
            nextPayoutDateMilliseconds: action.nextPayoutDateMilliseconds
        };
    }

    return state;
}

const Store: Readonly<Store<Readonly<State>, Readonly<Actions>>> = createStore(RootReducer);

// TODO use props and events for everything...determine what should be stored in here and what should be sent up
// TODO we want the host to be able to persist stuff if desired
export class DonationWallet extends HTMLElement {

    set payoutTargetUSDCents(payoutTargetUSDCents: USDCents) {
        Store.dispatch({
            type: 'SET_PAYOUT_TARGET_USD_CENTS',
            payoutTargetUSDCents
        });
    }

    set payoutIntervalDays(payoutIntervalDays: Days) {
        Store.dispatch({
            type: 'SET_PAYOUT_INTERVAL_DAYS',
            payoutIntervalDays
        });
    }

    set lastPayoutDateMilliseconds(lastPayoutDateMilliseconds: Milliseconds | 'NEVER') {
        Store.dispatch({
            type: 'SET_LAST_PAYOUT_DATE_MILLISECONDS',
            lastPayoutDateMilliseconds
        });
    }

    constructor() {
        super();
        Store.subscribe(async () => litRender(await this.render(Store.getState()), this));
    }

    async connectedCallback() {
        setTimeout(() => {
            Store.dispatch({
                type: 'RENDER'
            });
        });

        await fetchAndSetETHPriceInUSDCents();
        await fetchAndSetEthereumAccountBalanceInWEI();

        setInterval(async () => {
            await fetchAndSetETHPriceInUSDCents();
            await fetchAndSetEthereumAccountBalanceInWEI();
        }, 30000);
    }

    async render(state: Readonly<State>): Promise<Readonly<TemplateResult>> {

        const balanceInUSD = getBalanceInUSD(state.ethBalanceInWEI, state.ethPriceInUSDCents);
        const balanceInETH = getBalanceInETH(state.ethBalanceInWEI);

        const payoutTargetUSD = getPayoutTargetInUSD(state.payoutTargetUSDCents);
        const payoutTargetETH = getPayoutTargetInETH(state.payoutTargetUSDCents, state.ethPriceInUSDCents);

        const ethereumAddress = await get('ethereumAddress');
        const ethereumMnemonicPhrase = await get('ethereumMnemonicPhrase');

        const nextPayoutDate = getNextPayoutDate(state.lastPayoutDateMilliseconds, state.payoutIntervalDays);

        return html`
            <style>
            </style>
        
            <div style="font-weight: bold">Balance</div>
            <br>
            <div>USD: ${balanceInUSD}</div>
            <div>ETH: ${balanceInETH}</div>
            
            <br>

            <div style="font-weight: bold">Payout</div>
            <br>
            <div>USD: ${
                            payoutTargetUSD === 'Loading...' ?
                                'Loading...' :
                                html`
                                    <input 
                                        type="number"
                                        .value=${payoutTargetUSD}
                                        step="1"
                                        min="0"
                                        @input=${(e: any) => {
                                            this.dispatchEvent(new CustomEvent('payout-target-usd-cents-changed', {
                                                detail: {
                                                    payoutTargetUSDCents: Math.floor(parseFloat(e.target.value) * 100)
                                                }
                                            }));
                                        }}
                                    >
                                `}</div>
            <div>ETH: ${payoutTargetETH}</div>
            <br>
            <div>Days: ${
                state.payoutIntervalDays === 'NOT_SET' ? 
                    'Loading...' :
                    html`
                        <input
                            type="number"
                            .value=${state.payoutIntervalDays.toString()}
                            step="1"
                            min="0"
                            @input=${(e: any) => {
                                this.dispatchEvent(new CustomEvent('payout-interval-days-changed', {
                                    detail: {
                                        payoutIntervalDays: parseInt(e.target.value)
                                    }
                                }));
                            }}
                        >
                    `
            }</div>
            <div>Next payout: ${nextPayoutDate}</div>

            <br>

            <div><button @click=${showEthereumAddress}>Receive ETH</button></div>
            <br>
            <div><button>Pay now</button></div>

            <donation-modal
                ?hidden=${!state.showAcknowledgeMnemonicPhraseModal}
                @close=${() => {
                    Store.dispatch({
                        type: 'SET_SHOW_ACKNOWLEDGE_MNEMONIC_PHRASE_MODAL',
                        showAcknowledgeMnemonicPhraseModal: false
                    });
                }}
            >
                <div>You must copy down this 12 word phrase now or you could lose all of your funds:</div>
                <br>
                <div>${ethereumMnemonicPhrase}</div>
                <br>
                <button 
                    @click=${async () => {
                        Store.dispatch({
                            type: 'SET_SHOW_ACKNOWLEDGE_MNEMONIC_PHRASE_MODAL',
                            showAcknowledgeMnemonicPhraseModal: false
                        });
                        await set('ethereumMnemonicPhraseAcknowledged', true);
                        await showEthereumAddress();
                    }}
                >
                    Ok
                </button>
            </donation-modal>

            <donation-modal 
                ?hidden=${!state.showReceiveETHModal}
                @close=${() => {
                    Store.dispatch({
                        type: 'SET_SHOW_RECEIVE_ETH_MODAL',
                        showReceiveETHModal: false
                    })
                }}
            >
                <div>Send ETH here:</div>
                <br>
                <div style="word-wrap: break-word">${ethereumAddress}</div>
            </donation-modal>
        `;
    }
}

window.customElements.define('donation-wallet', DonationWallet);

function getNextPayoutDate(
    lastPayoutDateMilliseconds: Milliseconds | 'NEVER',
    payoutIntervalDays: Days | 'NOT_SET'
): string {

    if (payoutIntervalDays === 'NOT_SET') {
        return 'Loading...';
    }

    if (lastPayoutDateMilliseconds === 'NEVER') {
        return new Date(new Date().getTime() + payoutIntervalDays * 60000 * 60 * 24).toLocaleDateString();
    }
    
    return new Date(lastPayoutDateMilliseconds + payoutIntervalDays * 60000 * 60 * 24).toLocaleDateString();
}

function getBalanceInUSD(
    ethBalanceInWEI: WEI | 'UNKNOWN',
    ethPriceInUSDCents: USDCents | 'UNKNOWN'
) {
    if (
        ethBalanceInWEI === 'UNKNOWN' ||
        ethPriceInUSDCents === 'UNKNOWN'
    ) {
        return 'Loading...';
    }

    // TODO make sure we are taking care of this conversion appropriately
    // return new Number(convertWEIToUSD(ethBalanceInWEI, ethPriceInUSDCents).toString()).toFixed(2);
    return convertWEIToUSD(ethBalanceInWEI, ethPriceInUSDCents).toFixed(2);
}

function getBalanceInETH(
    ethBalanceInWEI: WEI | 'UNKNOWN'
) {
    if (ethBalanceInWEI === 'UNKNOWN') {
        return 'Loading...';
    }

    return convertWEIToETH(ethBalanceInWEI).toFixed(4);
    // return new Number(convertWEIToETH(ethBalanceInWEI).toString()).toFixed(4);
}

function convertWEIToUSD(wei: WEI, ethPriceInUSDCents: USDCents) {
    // return (BigInt(wei) * BigInt(ethPriceInUSDCents)) / BigInt(1e20);
    return (wei * ethPriceInUSDCents) / 1e20;
}

function convertWEIToETH(wei: WEI) {
    // return BigInt(wei) / BigInt(1e18);
    return wei / 1e18;
}

function convertUSDCentsToETH(usdCents: USDCents, ethPriceInUSDCents: USDCents) {
    return usdCents / ethPriceInUSDCents;
}

function getPayoutTargetInUSD(payoutTargetUSDCents: USDCents | 'NOT_SET') {

    if (payoutTargetUSDCents === 'NOT_SET') {
        return 'Loading...';
    }

    return (payoutTargetUSDCents / 100).toFixed(2);
}

function getPayoutTargetInETH(
    payoutTargetUSDCents: USDCents | 'NOT_SET',
    ethPriceInUSDCents: USDCents | 'UNKNOWN'
) {
    if (
        payoutTargetUSDCents === 'NOT_SET' ||
        ethPriceInUSDCents === 'UNKNOWN'
    ) {
        return 'Loading...';
    }

    return convertUSDCentsToETH(payoutTargetUSDCents, ethPriceInUSDCents).toFixed(4);
}

export const cryptonatorAPIEndpoint: CryptonatorETHPriceAPIEndpoint = `https://api.cryptonator.com/api/ticker/eth-usd`;
export const etherscanAPIEndpoint: EtherscanETHPriceAPIEndpoint = `https://api.etherscan.io/api?module=stats&action=ethprice`;

export async function fetchAndSetETHPriceInUSDCents(): Promise<any> {
    const ethPriceInUSDCents: USDCents | 'UNKNOWN' = await fetchETHPriceInUSDCents();

    if (ethPriceInUSDCents !== 'UNKNOWN') {
        Store.dispatch({
            type: 'SET_ETH_PRICE_IN_USD_CENTS',
            ethPriceInUSDCents
        });
    }
}

export async function fetchETHPriceInUSDCents(attemptNumber: number = 0): Promise<USDCents | 'UNKNOWN'> {
    try {
        if (attemptNumber === 0) {
            return await getCryptonatorETHPriceInUSDCents();
        }

        if (attemptNumber === 1) {
            return await getEtherscanETHPriceInUSDCents();
        }

        return 'UNKNOWN';
    }
    catch(error) {
        console.log('fetchETHPriceInUSDCents error', error);
        return await fetchETHPriceInUSDCents(attemptNumber + 1);
    }
}

async function getCryptonatorETHPriceInUSDCents(): Promise<USDCents> {
    const ethPriceJSON: any = await getCurrentETHPriceJSON(cryptonatorAPIEndpoint);
    const currentETHPriceInUSD: USD = ethPriceJSON.ticker.price;
    const currentETHPriceInUSDCents: USDCents = currentETHPriceInUSD * 100;    
    return Math.floor(currentETHPriceInUSDCents);
}

async function getEtherscanETHPriceInUSDCents(): Promise<USDCents> {
    const ethPriceJSON: any = await getCurrentETHPriceJSON(etherscanAPIEndpoint);
    const currentETHPriceInUSD: USD = ethPriceJSON.result.ethusd;
    const currentETHPriceInUSDCents: USDCents = currentETHPriceInUSD * 100;
    return Math.floor(currentETHPriceInUSDCents);
}

async function getCurrentETHPriceJSON(apiEndpoint: CryptonatorETHPriceAPIEndpoint | EtherscanETHPriceAPIEndpoint) {
    const ethPriceResponse: Readonly<Response> = await window.fetch(apiEndpoint);
    const ethPriceJSON: any = await ethPriceResponse.json();
    return ethPriceJSON;
}

export async function fetchAndSetEthereumAccountBalanceInWEI(): Promise<void> {
    // const ethereumBalanceInWEI: WEI = (await ethersProvider.getBalance(ethereumAddress)).toString();
    const ethereumAddress: EthereumAddress = await get('ethereumAddress');
    const ethBalanceInWEI: WEI = await ethersProvider.getBalance(ethereumAddress);

    console.log('ethBalanceInWEI', ethBalanceInWEI);

    Store.dispatch({
        type: 'SET_ETH_BALANCE_IN_WEI',
        ethBalanceInWEI
    });
}

export async function createWallet(donationWallet: Readonly<DonationWallet>, mnemonicPhrase?: string): Promise<void> {
    
    donationWallet.dispatchEvent(new CustomEvent('creating-wallet'));
    
    const newWallet = mnemonicPhrase ? ethers.Wallet.fromMnemonic(mnemonicPhrase) : ethers.Wallet.createRandom();

    // TODO we will probably need some more hardcore security than this
    await set('ethereumAddress', newWallet.address);
    await set('ethereumPrivateKey', newWallet.privateKey);
    await set('ethereumMnemonicPhrase', newWallet.mnemonic);
    await set('ethereumMnemonicPhraseAcknowledged', false);

    await fetchAndSetETHPriceInUSDCents();
    await fetchAndSetEthereumAccountBalanceInWEI();

    donationWallet.dispatchEvent(new CustomEvent('wallet-created'));
}

async function showEthereumAddress(): Promise<void> {
    const mnemonicPhraseAcknowledged: boolean | null | undefined = await get('ethereumMnemonicPhraseAcknowledged');

    if (
        mnemonicPhraseAcknowledged === false ||
        mnemonicPhraseAcknowledged === null ||
        mnemonicPhraseAcknowledged === undefined
    ) {
        Store.dispatch({
            type: 'SET_SHOW_ACKNOWLEDGE_MNEMONIC_PHRASE_MODAL',
            showAcknowledgeMnemonicPhraseModal: true
        });
        return;
    }

    Store.dispatch({
        type: 'SET_SHOW_RECEIVE_ETH_MODAL',
        showReceiveETHModal: true
    });
}