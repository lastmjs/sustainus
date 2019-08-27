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
    ReduxStore,
    Project
} from '../index.d.ts';

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
        walletCreationState: 'NOT_CREATED',
        payoutIntervalDays: 7,
        payoutTargetUSDCents: 1000,
        lastPayoutDateMilliseconds: 'NEVER',
        installedVersionOutOfDate: false
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

            const existingProject: Readonly<Project> = state.projects[action.project.name];

            if (existingProject) {
                const newProject: Readonly<Project> = {
                    ...existingProject,
                    ethereumAddress: action.project.ethereumAddress,
                    ethereumName: action.project.ethereumName
                };

                return {
                    ...state,
                    projects: {
                        ...state.projects,
                        [newProject.name]: newProject
                    }
                };
            }
            else {
                return {
                    ...state,
                    projects: {
                        ...state.projects,
                        [action.project.name]: action.project
                    }
                };
            }
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

        if (action.type === 'SET_PROJECT_LAST_PAYOUT_DATE_IN_MILLISECONDS') {

            const newProject: Readonly<Project> = {
                ...state.projects[action.projectName],
                lastPayoutDateInMilliseconds: action.lastPayoutDateInMilliseconds
            };

            return {
                ...state,
                projects: {
                    ...state.projects,
                    [action.projectName]: newProject
                }
            };
        }

        if (action.type === 'SET_PROJECT_LAST_TRANSACTION_HASH') {

            const newProject: Readonly<Project> = {
                ...state.projects[action.projectName],
                lastTransactionHash: action.lastTransactionHash
            };

            return {
                ...state,
                projects: {
                    ...state.projects,
                    [action.projectName]: newProject
                }
            };
        }

        if (action.type === 'SET_INSTALLED_VERSION_OUT_OF_DATE') {
            return {
                ...state,
                installedVersionOutOfDate: action.installedVersionOutOfDate
            };
        }
    
        return state;
    };
}