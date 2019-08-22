import { createStore } from 'redux/es/redux.mjs'; // TODO I would rather avoid this, but import maps are working for now

const InitialState = {
    searchState: 'NOT_SEARCHING',
    verifiedProjects: {}
};

function RootReducer(state=InitialState, action) {

    if (action.type === 'SET_SEARCH_STATE') {
        return {
            ...state,
            searchState: action.searchState
        };
    }

    if (action.type === 'ADD_VERIFIED_PROJECT') {
        return {
            ...state,
            verifiedProjects: {
                ...state.verifiedProjects,
                [action.name]: {
                    name: action.name,
                    ethereumAddress: action.ethereumAddress,
                    ethereumName: action.ethereumName
                }
            }
        };
    }

    return state;
}

export const Store = createStore(RootReducer);