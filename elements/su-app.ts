import { 
    html,
    render as litRender,
    TemplateResult
} from 'lit-html';
import { prepareStore } from '../services/store.ts';
import { searchForVerifiedProjects } from '../services/utilities.ts';
import {
    State,
    Project
} from '../index';

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
    
            Store.dispatch({
                type: 'SET_SEARCH_STATE',
                searchState: 'SEARCHING'
            });
    
            await searchForVerifiedProjects(Store);
    
            Store.dispatch({
                type: 'SET_SEARCH_STATE',
                searchState: 'NOT_SEARCHING'
            });
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
});
