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
import BigNumber from 'bignumber.js';

declare var ethers: any;

type EthereumNetworkName = 'homestead' | 'ropsten';
export type HexString = string;

const networkName: EthereumNetworkName = process.env.NODE_ENV === 'development' ? 'ropsten' : 'homestead';

export type EthereumTransactionDatum = {
    readonly id: string;
    readonly to: EthereumAddress;
    readonly value: WEI;
    readonly gasLimit: number;
    readonly gasPrice: WEI;
    readonly data: HexString;
}

// TODO make sure the types are good here...hex strings might be used a lot
export type EthereumTransaction = {
    readonly to: EthereumAddress;
    readonly value: WEI;
    readonly gasLimit: number;
    readonly gasPrice: WEI;
    readonly nonce: number;
    readonly data: HexString;
}

export const ethersProvider = ethers.getDefaultProvider(networkName);

export type WalletCreationState = 'NOT_CREATED' | 'CREATING' | 'CREATED';

export type CryptonatorETHPriceAPIEndpoint = `https://api.cryptonator.com/api/ticker/eth-usd`;
export type EtherscanETHPriceAPIEndpoint = `https://api.etherscan.io/api?module=stats&action=ethprice`;

export type EthereumAddress = string;

type State = {
    readonly ethBalanceInWEI: WEI | 'UNKNOWN';
    readonly ethPriceInUSDCents: USDCents | 'UNKNOWN';
    readonly payoutTargetUSDCents: USDCents | 'NOT_SET';
    readonly payoutIntervalDays: Days | 'NOT_SET';
    readonly lastPayoutDateMilliseconds: Milliseconds | 'NEVER';
    readonly nextPayoutDateMilliseconds: Milliseconds | 'NEVER';
    readonly showAcknowledgeMnemonicPhraseModal: boolean;
    readonly showReceiveETHModal: boolean;
    readonly nonce: number;
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

type SET_NONCE = {
    readonly type: 'SET_NONCE';
    readonly nonce: number;
}

type Actions = 
    SET_NONCE |
    SET_NEXT_PAYOUT_DATE_MILLISECONDS |
    SET_SHOW_ACKNOWLEDGE_MNEMONIC_PHRASE_MODAL |
    SET_SHOW_RECEIVE_ETH_MODAL |
    SET_LAST_PAYOUT_DATE_MILLISECONDS |
    SET_PAYOUT_TARGET_USD_CENTS |
    SET_PAYOUT_INTERVAL_DAYS |
    SET_ETH_BALANCE_IN_WEI |
    SET_ETH_PRICE_IN_USD_CENTS |
    RENDER;

type ETH = string;
export type WEI = string;
type GWEI = string;

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
    showReceiveETHModal: false,
    nonce: 0
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

    if (action.type === 'SET_NONCE') {
        return {
            ...state,
            nonce: action.nonce
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

        setInterval(async () => {
            const state: Readonly<State> = Store.getState();

            if (state.payoutIntervalDays !== 'NOT_SET') {
                if (new Date().getTime() >= getNextPayoutDateInMilliseconds(state.lastPayoutDateMilliseconds, state.payoutIntervalDays)) {
                    this.dispatchEvent(new CustomEvent('payout-interval-elapsed'));
                }
            }
        }, 30000);
    }

    async render(state: Readonly<State>): Promise<Readonly<TemplateResult>> {

        const balanceInUSD = getBalanceInUSD(state.ethBalanceInWEI, state.ethPriceInUSDCents);
        const balanceInETH = getBalanceInETH(state.ethBalanceInWEI);

        const payoutTargetUSD = getPayoutTargetInUSD(state.payoutTargetUSDCents);
        const payoutTargetETH = getPayoutTargetInETH(state.payoutTargetUSDCents, state.ethPriceInUSDCents);

        const ethereumAddress = await get('ethereumAddress');
        const ethereumMnemonicPhrase = await get('ethereumMnemonicPhrase');

        const nextPayoutDate = getNextPayoutDateFormatted(state.lastPayoutDateMilliseconds, state.payoutIntervalDays);

        return html`
            <style>
                .donation-wallet-main-container {
                    /* display: flex; */
                    /* flex-direction: column; */
                    /* align-items: center; */
                }

                .donation-wallet-square-row {
                    display: flex;
                    margin-bottom: calc(50px + 1vmin);
                    flex-wrap: wrap;
                }

                .donation-wallet-square {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    flex: 1;
                }

                .donation-wallet-value {
                    font-size: calc(50px + 1vmin);
                }

                .donation-wallet-ticker {
                    font-size: calc(25px + 1vmin);
                    border-top: 1px solid black;
                }

                .donation-wallet-title {
                    display: flex;
                    justify-content: center;
                    font-size: calc(25px + 1vmin);
                    font-weight: bold;
                }
            </style>
        
            <div class="donation-wallet-main-container">
                <div class="donation-wallet-title">
                    <div>Balance</div>
                </div>

                <div class="donation-wallet-square-row">
                    <div class="donation-wallet-square">
                        <div class="donation-wallet-value">${balanceInUSD}</div>
                        <div class="donation-wallet-ticker">USD</div>
                    </div>

                    <div class="donation-wallet-square">
                        <div class="donation-wallet-value">${balanceInETH}</div>
                        <div class="donation-wallet-ticker">ETH</div>                
                    </div>
                </div>

                <div class="donation-wallet-title">
                    <div>Payout</div>
                </div>

                <div class="donation-wallet-square-row">
                    <div class="donation-wallet-square">
                        <div class="donation-wallet-value">
                            ${
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
                                    `}
                        </div>

                        <div class="donation-wallet-ticker">USD</div>
                    </div>

                    <div class="donation-wallet-square">
                        <div class="donation-wallet-value">${payoutTargetETH}</div>
                        <div class="donation-wallet-ticker">ETH</div>                
                    </div>
                </div>

                <div class="donation-wallet-square-row">
                    <div class="donation-wallet-square">
                        <div class="donation-wallet-value">
                            ${
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
                            }
                        </div>
                        <div class="donation-wallet-ticker">Days</div>
                    </div>

                    <div class="donation-wallet-square">
                            <div class="donation-wallet-value">${nextPayoutDate}</div>
                            <div class="donation-wallet-ticker">Next payout</div>
                    </div>
                </div>
            </div>

            <div><button @click=${showEthereumAddress}>Receive ETH</button></div>
            <br>
            <div><button @click=${() => this.dispatchEvent(new CustomEvent('pay-now'))}>Pay now</button></div>

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

function getNextPayoutDateFormatted(
    lastPayoutDateMilliseconds: Milliseconds | 'NEVER',
    payoutIntervalDays: Days | 'NOT_SET'
): string {

    if (payoutIntervalDays === 'NOT_SET') {
        return 'Loading...';
    }

    const nextPayoutDateInMilliseconds: Milliseconds = getNextPayoutDateInMilliseconds(lastPayoutDateMilliseconds, payoutIntervalDays);

    return new Date(nextPayoutDateInMilliseconds).toLocaleDateString();
}

function getNextPayoutDateInMilliseconds(
    lastPayoutDateMilliseconds: Milliseconds | 'NEVER',
    payoutIntervalDays: Days
) {
    if (lastPayoutDateMilliseconds === 'NEVER') {
        return new Date().getTime() + payoutIntervalDays * 60000 * 60 * 24;
    }
    
    return lastPayoutDateMilliseconds + payoutIntervalDays * 60000 * 60 * 24;
}

function getBalanceInUSD(
    ethBalanceInWEI: WEI | 'UNKNOWN',
    ethPriceInUSDCents: USDCents | 'UNKNOWN'
): string {
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
): string {
    if (ethBalanceInWEI === 'UNKNOWN') {
        return 'Loading...';
    }

    return new BigNumber(convertWEIToETH(ethBalanceInWEI)).toFixed(4);
}

function convertWEIToUSD(wei: WEI, ethPriceInUSDCents: USDCents): number {
    return new BigNumber(wei).multipliedBy(ethPriceInUSDCents).dividedBy(1e20).toNumber();
}

function convertWEIToETH(wei: WEI): ETH {
    return new BigNumber(wei).dividedBy(1e18).toString();
}

function convertUSDCentsToETH(usdCents: USDCents, ethPriceInUSDCents: USDCents): ETH {
    return new BigNumber(usdCents).dividedBy(ethPriceInUSDCents).toString();
}

export function convertUSDCentsToWEI(usdCents: USDCents, ethPriceInUSDCents: USDCents): WEI {
    return new BigNumber(usdCents).dividedBy(ethPriceInUSDCents).multipliedBy(1e18).toFixed(0);
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

    return new BigNumber(convertUSDCentsToETH(payoutTargetUSDCents, ethPriceInUSDCents)).toFixed(4);
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

export async function pay(
    donationWallet: Readonly<DonationWallet>, // TODO it is kind of weird that we are passing this in...perhaps this should be on the instance
    transactionData: ReadonlyArray<EthereumTransactionDatum>
) {
    console.log('pay');

    for (let i=0; i < transactionData.length; i++) {
        const transactionDatum: Readonly<EthereumTransactionDatum> = transactionData[i];

        console.log('transactionDatum', transactionDatum);

        const transaction = await prepareAndSendTransaction(transactionDatum);

        console.log('transaction.hash', transaction.hash);

        donationWallet.dispatchEvent(new CustomEvent('transaction-completed', {
            detail: {
                id: transactionDatum.id,
                transactionHash: transaction.hash
            }
        }))
    }
}

async function prepareAndSendTransaction(transactionDatum: Readonly<EthereumTransactionDatum>) {
    const wallet = new ethers.Wallet(await get('ethereumPrivateKey'), ethersProvider);
    
    const nonceFromNetwork: number = await ethersProvider.getTransactionCount(wallet.address);
    const nonceFromState: number = Store.getState().nonce;
    
    if (nonceFromState > nonceFromNetwork) {
        Store.dispatch({
            type: 'SET_NONCE',
            nonce: nonceFromState
        });
    }
    else {
        Store.dispatch({
            type: 'SET_NONCE',
            nonce: nonceFromNetwork
        });
    }

    const nonce = Store.getState().nonce;

    const newNonce = nonce + 1;

    Store.dispatch({
        type: 'SET_NONCE',
        nonce: newNonce
    });

    const preparedTransaction: Readonly<EthereumTransaction> = {
        to: transactionDatum.to,
        value: ethers.utils.bigNumberify(transactionDatum.value),
        gasLimit: transactionDatum.gasLimit,
        gasPrice: ethers.utils.bigNumberify(transactionDatum.gasPrice),
        nonce,
        data: transactionDatum.data
    };

    console.log('preparedTransaction', preparedTransaction);
    
    const transaction = await wallet.sendTransaction(preparedTransaction);

    console.log('transaction', transaction);

    return transaction;
}

export async function getGasLimit(dataHex: HexString, to: EthereumAddress, value: WEI): Promise<number> {
    return await ethersProvider.estimateGas({
        to,
        value,
        data: dataHex
    });
}

// TODO we need a contingency plan for this oracle...
export async function getSafeLowGasPriceInWEI(): Promise<WEI> {
    const gasPriceResponse = await window.fetch('https://ethgasstation.info/json/ethgasAPI.json');
    const gasPriceJSON = await gasPriceResponse.json();

    const safeLowGasPriceInGWEI: GWEI = gasPriceJSON.safeLow;
    // const safeLowGasPriceInGWEIBigNumber: BigNumber = new BigNumber(safeLowGasPriceInGWEI);
    // For some reason the API is returning GWEI times 10, so I multiply by 1e8 instead of 1e9
    // It's true, look here: https://github.com/ethgasstation/ethgasstation-backend/issues/5
    // const safeLowGasPriceInWEI: WEI = safeLowGasPriceInGWEIBigNumber.multipliedBy(1e8).toFixed(0);
    // const safeLowGasPriceInWEI: WEI = safeLowGasPriceInGWEIBigNumber.multipliedBy(1e8).toFixed(0);
    // Math.floor(new Number((BigInt(safeLowGasPriceInGWEI) * BigInt(1e8)).toString()));
    // const safeLowGasPriceInWEI: WEI = Math.floor(new Number((BigInt(safeLowGasPriceInGWEI) * BigInt(1e8))).toString());
    // const safeLowGasPriceInWEI: WEI = parseInt((BigInt(safeLowGasPriceInGWEI) * BigInt(1e8)).toString()); // TODO make sure we are using bigint correctly
    const safeLowGasPriceInWEI: WEI = new BigNumber(safeLowGasPriceInGWEI).multipliedBy(1e8).toString();

    return safeLowGasPriceInWEI;
}