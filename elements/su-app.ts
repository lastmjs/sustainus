import { 
    html,
    render as litRender,
    TemplateResult
} from 'lit-html';
import { prepareStore } from '../services/store.ts';
import { searchForVerifiedProjects } from '../services/utilities.ts';
import {
    State,
    Project,
    Milliseconds
} from '../index';

// TODO we must type the store
prepareStore().then((Store) => {
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
            }, 0);
        }
    
        render(state: Readonly<State>): Readonly<TemplateResult> {
            console.log('state', state);
            return html`
                <h1>Sustainus</h1>
    
                <div>${state.searchState === 'NOT_SEARCHING' ? 'Search complete' : 'Searching...'}</div>
    
                <h2>Verified Projects</h2>
    
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
        alert('I am alive');

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
