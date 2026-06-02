/* eslint-disable no-unused-expressions */
import { fixture, expect, html } from '@open-wc/testing';
import sinon, { spy } from 'sinon';
import { OscdFilledTextField } from '@omicronenergy/oscd-ui/textfield/OscdFilledTextField.js';
import { AddSubfunctionDialog } from './add-subfunction-dialog.js';

if (!customElements.get('add-subfunction-dialog')) {
  customElements.define('add-subfunction-dialog', AddSubfunctionDialog);
}

describe('AddSubfunctionDialog', () => {
  let element: AddSubfunctionDialog;
  let doc: XMLDocument;

  beforeEach(async () => {
    doc = new DOMParser().parseFromString(
      `<?xml version="1.0" encoding="UTF-8"?><SCL></SCL>`,
      'application/xml'
    );
    element = await fixture(
      html`<add-subfunction-dialog></add-subfunction-dialog>`
    );
    await element.updateComplete;
  });

  it('renders dialog and form fields', () => {
    expect(element.shadowRoot?.querySelector('oscd-dialog')).to.exist;
    expect(
      element.shadowRoot?.querySelector('oscd-filled-text-field[name="name"]')
    ).to.exist;
    expect(
      element.shadowRoot?.querySelector(
        'oscd-scl-text-field[name="description"]'
      )
    ).to.exist;
    expect(
      element.shadowRoot?.querySelector('oscd-scl-text-field[name="type"]')
    ).to.exist;
  });

  it('shows error if name is empty on submit', async () => {
    element.show();
    await element.updateComplete;
    const nextBtn = Array.from(
      element.shadowRoot?.querySelectorAll('oscd-filled-button') ?? []
    ).find(btn => btn.textContent?.trim() === 'Next') as HTMLElement;
    nextBtn.click();
    await element.updateComplete;
    const nameField = element.shadowRoot?.querySelector(
      'oscd-filled-text-field[name="name"]'
    ) as any;
    expect(nameField?.error).to.be.true;
    expect(nameField?.errorText).to.equal('Name is required');
  });

  it('shows error if duplicate SubFunction name exists in parent', async () => {
    const parent = doc.createElement('Function');
    const child1 = doc.createElement('SubFunction');
    child1.setAttribute('name', 'SF1');
    parent.appendChild(child1);
    element.subfunctions = [{ name: 'SF1', description: 'desc', type: 'type' }];
    element.name = 'SF1';
    await element.updateComplete;
    element.show();
    await element.updateComplete;
    const nextBtn = Array.from(
      element.shadowRoot?.querySelectorAll('oscd-filled-button') ?? []
    ).find(btn => btn.textContent?.trim() === 'Next') as HTMLElement;
    nextBtn.click();
    await element.updateComplete;
    const nameField = element.shadowRoot?.querySelector(
      'oscd-filled-text-field[name="name"]'
    ) as OscdFilledTextField;
    expect(nameField?.error).to.be.true;
    expect(nameField?.errorText).to.equal(
      'A SubFunction with the name "SF1" already exists'
    );
  });

  it('dispatches next event with correct details', async () => {
    const dispatchSpy = spy(element, 'dispatchEvent');
    element.name = 'SF2';
    element.description = 'Test description';
    element.type = 'TestType';
    element.show();
    await element.updateComplete;
    const nextBtn = Array.from(
      element.shadowRoot?.querySelectorAll('oscd-filled-button') ?? []
    ).find(btn => btn.textContent?.trim() === 'Next') as HTMLElement;
    nextBtn.click();
    await element.updateComplete;

    expect(dispatchSpy.calledWithMatch(sinon.match.has('type', 'next'))).to.be
      .true;
    const nextEvent = dispatchSpy
      .getCalls()
      .find(call => call.args[0].type === 'next')?.args[0] as CustomEvent;
    expect(nextEvent?.detail).to.deep.equal({
      name: 'SF2',
      description: 'Test description',
      type: 'TestType',
    });
  });

  it('dispatches cancel event on close', async () => {
    const dispatchSpy = spy(element, 'dispatchEvent');
    element.show();
    await element.updateComplete;
    (element as any).handleClosed();
    await element.updateComplete;
    expect(dispatchSpy.calledWithMatch(sinon.match.has('type', 'cancel'))).to.be
      .true;
  });

  it('resets fields on close', async () => {
    element.name = 'SF3';
    element.description = 'desc';
    element.type = 'type';
    (element as any).handleClosed();
    await element.updateComplete;
    expect(element.name).to.equal('');
    expect(element.description).to.equal(null);
    expect(element.type).to.equal(null);
    const nameField = element.shadowRoot?.querySelector(
      'oscd-filled-text-field[name="name"]'
    ) as any;
    expect(nameField?.error).to.be.false;
    expect(nameField?.errorText).to.equal('');
  });

  it('does not dispatch cancel event when Next is pressed', async () => {
    const dispatchSpy = spy(element, 'dispatchEvent');
    element.name = 'SF4';
    element.show();
    await element.updateComplete;
    const nextBtn = Array.from(
      element.shadowRoot?.querySelectorAll('oscd-filled-button') ?? []
    ).find(btn => btn.textContent?.trim() === 'Next') as HTMLElement;
    nextBtn.click();
    await element.updateComplete;
    (element as any).handleClosed();
    await element.updateComplete;
    const cancelEvents = dispatchSpy
      .getCalls()
      .filter(call => call.args[0].type === 'cancel');
    expect(cancelEvents.length).to.equal(0);
  });
});
