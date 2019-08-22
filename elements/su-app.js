import { html, render as litRender } from 'lit-html';
import { Store } from '../services/store.js';
import { searchForVerifiedProjects } from '../services/utilities.js';

class SUApp extends HTMLElement {
    constructor() {
        super();
        Store.subscribe(() => litRender(this.render(Store.getState()), this));
    }

    async connectedCallback() {
        setTimeout(() => {
            Store.dispatch({
                type: 'RENDER'
            });
        });

        Store.dispatch({
            type: 'SET_SEARCH_STATE',
            searchState: 'SEARCHING'
        });

        await searchForVerifiedProjects();

        Store.dispatch({
            type: 'SET_SEARCH_STATE',
            searchState: 'NOT_SEARCHING'
        });
    }

    render(state) {
        console.log('state', state);
        return html`
            <h1>Sustainus</h1>

            <div>${state.searchState === 'NOT_SEARCHING' ? 'Search complete' : 'Searching...'}</div>

            <h2>Verified Projects</h2>

            ${Object.values(state.verifiedProjects).length !== 0 ? Object.values(state.verifiedProjects).map((verifiedProject) => {
                return html`
                    <div>Name: ${verifiedProject.name}</div>
                    <div>Ethereum address: ${verifiedProject.ethereumAddress}</div>
                `;
            }) : html`<div>No verified projects found</div>`}
        `;
    }
}

window.customElements.define('su-app', SUApp);