/* eslint-disable no-unused-expressions */
import { html } from 'lit';
import { spy } from 'sinon';
import { fixture, expect } from '@open-wc/testing';
import { FunctionContentPanel } from './function-content-panel.js';
import { docWithBayAndFunctions, docWithNestedFunctions, } from './functions-layer-testfiles.js';
if (!customElements.get('function-content-panel')) {
    customElements.define('function-content-panel', FunctionContentPanel);
}
describe('FunctionContentPanel', () => {
    let element;
    beforeEach(async () => {
        element = await fixture(html `<function-content-panel></function-content-panel>`);
    });
    function getFunctionElementFromDoc(docString) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(docString, 'text/xml');
        const functionElement = doc.querySelector('Function');
        return functionElement;
    }
    it('renders empty state when no functionElement is provided', async () => {
        const functionElement = getFunctionElementFromDoc(docWithBayAndFunctions);
        element.functionElement = functionElement;
        await element.updateComplete;
        const emptyState = element.shadowRoot?.querySelector('.empty-state');
        expect(emptyState).to.exist;
        expect(emptyState?.textContent).to.include('No SubFunctions or LNodes');
    });
    it('renders function name', async () => {
        const functionElement = getFunctionElementFromDoc(docWithBayAndFunctions);
        element.functionElement = functionElement;
        await element.updateComplete;
        const headerText = element.shadowRoot?.querySelector('.header-text h3');
        expect(headerText).to.exist;
        expect(headerText?.textContent).to.equal('F1');
    });
    it('renders SubFunctions and LNodes', async () => {
        const functionElement = getFunctionElementFromDoc(docWithNestedFunctions);
        element.functionElement = functionElement;
        await element.updateComplete;
        const subFunctionsList = element.shadowRoot?.querySelectorAll('oscd-list')[0];
        expect(subFunctionsList).to.exist;
        expect(subFunctionsList?.querySelectorAll('oscd-list-item').length).to.equal(1);
        const subFunctionItem = subFunctionsList?.querySelector('oscd-list-item');
        expect(subFunctionItem).to.exist;
        expect(subFunctionItem?.textContent).to.include('SF1');
        const lNodesList = element.shadowRoot?.querySelectorAll('oscd-list')[1];
        expect(lNodesList).to.exist;
        expect(lNodesList?.querySelectorAll('oscd-list-item').length).to.equal(1);
        const lnodeItem = lNodesList?.querySelector('oscd-list-item');
        expect(lnodeItem).to.exist;
        expect(lnodeItem?.textContent).to.include('LLN0');
    });
    it('dispatches close event when close button is clicked', async () => {
        const functionElement = getFunctionElementFromDoc(docWithBayAndFunctions);
        element.functionElement = functionElement;
        await element.updateComplete;
        const spyEvent = spy();
        element.addEventListener('close', spyEvent);
        const closeButton = element.shadowRoot?.querySelector('.close-btn');
        expect(closeButton).to.exist;
        closeButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        expect(spyEvent.calledOnce).to.be.true;
    });
});
//# sourceMappingURL=function-content-panel.spec.js.map