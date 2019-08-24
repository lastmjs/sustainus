import { 
    html,
    render as litRender,
    TemplateResult
} from 'lit-html';

class DonationModal extends HTMLElement {

    connectedCallback() {
        this.attachShadow({ mode: 'open' });

        if (this.shadowRoot === null) {
            throw new Error('this.shadowRoot is null');
        }

        litRender(html`
            <style>
                .main-container {
                    position: absolute;
                    background-color: white;
                    width: calc(25vw + 1vmin);
                    box-shadow: 0px 0px 4px grey;
                    margin-left: auto;
                    margin-right: auto;
                    left: 0;
                    right: 0;
                    top: 25vh;
                    padding: calc(25px + 1vmin);
                    padding-bottom: calc(50px + 1vmin);
                }
            </style>

            <div class="main-container">
                <slot></slot>
                <button style="position: absolute; bottom: 10px; right: 10px" @click=${() => this.dispatchEvent(new CustomEvent('close'))}>Close</button>
            </div>
        `, this.shadowRoot);
    }


}

window.customElements.define('donation-modal', DonationModal);