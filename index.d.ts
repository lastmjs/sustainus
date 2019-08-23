export type State = {
    readonly version: number;
    readonly projects: {
        [name: string]: Readonly<Project>;
    };
    readonly searchState: SearchState;
}

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

export type Actions = 
    SET_SEARCH_STATE |
    ADD_PROJECT;

export type Reducer = (state: Readonly<State>, action: Readonly<Actions>) => Readonly<State>;