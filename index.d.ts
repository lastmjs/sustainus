import { Store } from 'redux';
import { WalletCreationState } from './elements/donation-wallet.ts';

export type State = {
    readonly version: number;
    readonly projects: {
        [name: string]: Readonly<Project>;
    };
    readonly searchState: SearchState;
    readonly lastProjectSearchDate: Milliseconds | 'NEVER';
    readonly walletCreationState: WalletCreationState;
    readonly payoutTargetUSDCents: USDCents;
    readonly payoutIntervalDays: Days;
    readonly lastPayoutDateMilliseconds: Milliseconds | 'NEVER';
}

export type CryptonatorETHPriceAPIEndpoint = `https://api.cryptonator.com/api/ticker/eth-usd`;
export type EtherscanETHPriceAPIEndpoint = `https://api.etherscan.io/api?module=stats&action=ethprice`;

export type ReduxStore = Readonly<Store<Readonly<State>, Readonly<Actions>>>;
export type Days = number;
export type USD = number;
export type USDCents = number;

export type Project = {
    name: string;
    ethereumAddress: EthereumAddress | 'NOT_SET';
    ethereumName: EthereumName | 'NOT_SET';
}

export type SearchState = 'SEARCHING' | 'NOT_SEARCHING';

export type EthereumAddress = string;
export type EthereumName = string;

export type SET_SEARCH_STATE = {
    readonly type: 'SET_SEARCH_STATE';
    readonly searchState: SearchState;
}

export type ADD_PROJECT = {
    readonly type: 'ADD_PROJECT';
    readonly project: Readonly<Project>;
}

export type SET_LAST_PROJECT_SEARCH_DATE = {
    readonly type: 'SET_LAST_PROJECT_SEARCH_DATE';
    readonly lastProjectSearchDate: Milliseconds;
}

export type RENDER = {
    readonly type: 'RENDER';
}

export type SET_WALLET_CREATION_STATE = {
    readonly type: 'SET_WALLET_CREATION_STATE';
    readonly walletCreationState: WalletCreationState;
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
    readonly lastPayoutDateMilliseconds: Milliseconds;
}

export type ETHPriceInUSDCentsState = 'NOT_FETCHED' | 'FETCHING' | 'UNKNOWN';

export type Actions = 
    SET_PAYOUT_INTERVAL_DAYS |
    SET_PAYOUT_TARGET_USD_CENTS |
    SET_LAST_PAYOUT_DATE_MILLISECONDS |
    SET_WALLET_CREATION_STATE |
    SET_SEARCH_STATE |
    ADD_PROJECT |
    SET_LAST_PROJECT_SEARCH_DATE |
    RENDER;

export type Reducer = (state: Readonly<State>, action: Readonly<Actions>) => Readonly<State>;

export type Milliseconds = number;