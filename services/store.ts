import { 
    get,
    set
} from 'idb-keyval';
import { State } from '../index';
import { 
    createStore,
    Store
} from 'redux/es/redux.mjs'; // TODO I would rather avoid this, but import maps are working for now
import {
    Actions,
    Reducer,
    ReduxStore
} from '../index';

export async function prepareStore(): Promise<Readonly<ReduxStore>> {
    const persistedState: Readonly<State> = await get('state');
    const version: number = 0;

    const InitialState: Readonly<State> = await getInitialState(persistedState, version);
    const RootReducer: Reducer = await getRootReducer(InitialState);

    return createStore((state: Readonly<State>, action: Readonly<Actions>) => {
        const newState: Readonly<State> = RootReducer(state, action);

        set('state', newState);

        return newState;
    });
}

async function getInitialState(
    persistedState: Readonly<State>,
    version: number
): Promise<Readonly<State>> {
    if (
        persistedState === null ||
        persistedState === undefined
    ) {
        return await getOriginalState(version);
    }
    else {
        // TODO this is where we will run migrations
        return persistedState;
    }
}

async function getOriginalState(version: number): Promise<Readonly<State>> {
    return {
        version,
        searchState: 'NOT_SEARCHING',
        projects: {},
        lastProjectSearchDate: 'NEVER',
        walletCreationState: 'NOT_CREATED'
    };
} 

function getRootReducer(initialState: Readonly<State>): Reducer {
    return (state: Readonly<State>=initialState, action: Readonly<Actions>): Readonly<State> => {
        if (action.type === 'SET_SEARCH_STATE') {
            return {
                ...state,
                searchState: action.searchState
            };
        }
    
        if (action.type === 'ADD_PROJECT') {
            return {
                ...state,
                projects: {
                    ...state.projects,
                    [action.project.name]: {
                        name: action.project.name,
                        ethereumAddress: action.project.ethereumAddress,
                        ethereumName: action.project.ethereumName
                    }
                }
            };
        }

        if (action.type === 'SET_LAST_PROJECT_SEARCH_DATE') {
            return {
                ...state,
                lastProjectSearchDate: action.lastProjectSearchDate
            };
        }

        if (action.type === 'SET_WALLET_CREATION_STATE') {
            return {
                ...state,
                walletCreationState: action.walletCreationState
            };
        }
    
        return state;
    };
}