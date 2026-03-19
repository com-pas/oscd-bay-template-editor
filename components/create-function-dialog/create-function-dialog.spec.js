/* eslint-disable no-unused-expressions */
import { fixture, expect, html } from '@open-wc/testing';
import sinon, { spy } from 'sinon';
import { CreateFunctionDialog } from './create-function-dialog.js';
if (!customElements.get('create-function-dialog')) {
    customElements.define('create-function-dialog', CreateFunctionDialog);
}
describe('CreateFunctionDialog', () => {
    let element;
    let doc;
    beforeEach(async () => {
        doc = new DOMParser().parseFromString(`<?xml version="1.0" encoding="UTF-8"?><SCL></SCL>`, 'application/xml');
        element = await fixture(html `<create-function-dialog></create-function-dialog>`);
        await element.updateComplete;
    });
    it('renders dialog and form fields', () => {
        expect(element.shadowRoot?.querySelector('oscd-dialog')).to.exist;
        expect(element.shadowRoot?.querySelector('oscd-filled-text-field[name="name"]')).to.exist;
        expect(element.shadowRoot?.querySelector('oscd-scl-text-field[name="description"]')).to.exist;
        expect(element.shadowRoot?.querySelector('oscd-scl-text-field[name="type"]')).to.exist;
    });
    it('shows error if name is empty on submit', async () => {
        element.show();
        await element.updateComplete;
        const form = element.shadowRoot?.querySelector('form');
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        await element.updateComplete;
        const nameField = element.shadowRoot?.querySelector('oscd-filled-text-field[name="name"]');
        expect(nameField?.error).to.be.true;
        expect(nameField?.errorText).to.equal('Name is required');
    });
    it('shows error if duplicate name exists in parent', async () => {
        const parent = doc.createElement('Bay');
        const child1 = doc.createElement('Function');
        child1.setAttribute('name', 'F1');
        parent.appendChild(child1);
        element.parent = parent;
        element.name = 'F1';
        await element.updateComplete;
        element.show();
        await element.updateComplete;
        const form = element.shadowRoot?.querySelector('form');
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        await element.updateComplete;
        const nameField = element.shadowRoot?.querySelector('oscd-filled-text-field[name="name"]');
        expect(nameField?.error).to.be.true;
        expect(nameField?.errorText).to.equal('A Function with the name "F1" already exists');
    });
    it('dispatches save event with correct details', async () => {
        const dispatchSpy = spy(element, 'dispatchEvent');
        element.name = 'F2';
        element.description = null;
        element.type = null;
        element.show();
        await element.updateComplete;
        const form = element.shadowRoot?.querySelector('form');
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        await element.updateComplete;
        expect(dispatchSpy.calledWithMatch(sinon.match.has('type', 'save'))).to.be
            .true;
        const saveEvent = dispatchSpy
            .getCalls()
            .find(call => call.args[0].type === 'save')?.args[0];
        expect(saveEvent?.detail).to.deep.equal({
            name: 'F2',
            description: null,
            type: null,
        });
    });
    it('dispatches cancel event on close', async () => {
        const dispatchSpy = spy(element, 'dispatchEvent');
        element.show();
        await element.updateComplete;
        const closeBtn = element.shadowRoot?.querySelector('oscd-filled-button[type="button"]');
        closeBtn?.click();
        await element.updateComplete;
        expect(dispatchSpy.calledWithMatch(sinon.match.has('type', 'cancel'))).to.be
            .true;
    });
    it('resets fields on close', async () => {
        element.name = 'F3';
        element.description = null;
        element.type = null;
        element.close();
        await element.updateComplete;
        expect(element.name).to.equal('');
        expect(element.description).to.equal(null);
        expect(element.type).to.equal(null);
        const nameField = element.shadowRoot?.querySelector('oscd-filled-text-field[name="name"]');
        expect(nameField?.error).to.be.false;
        expect(nameField?.errorText).to.equal('');
    });
});
//# sourceMappingURL=create-function-dialog.spec.js.map