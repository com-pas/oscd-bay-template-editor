/* eslint-disable no-unused-expressions */
import { fixture, expect, html, waitUntil } from '@open-wc/testing';
import sinon, { spy } from 'sinon';
import { OscdFilledTextField } from '@omicronenergy/oscd-ui/textfield/OscdFilledTextField.js';
import {
  CreateFunctionDialog,
  CreateFunctionDialogStep,
} from './create-function-dialog.js';
import { emptyDoc } from '../../testfiles.js';

if (!customElements.get('create-function-dialog')) {
  customElements.define('create-function-dialog', CreateFunctionDialog);
}

describe('CreateFunctionDialog', () => {
  let element: CreateFunctionDialog;
  let doc: XMLDocument;

  beforeEach(async () => {
    doc = new DOMParser().parseFromString(emptyDoc, 'application/xml');
    element = await fixture(
      html`<create-function-dialog></create-function-dialog>`
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
    const nextBtn = element.shadowRoot?.querySelector(
      'oscd-filled-button[data-testid="next-button"]'
    ) as HTMLElement;
    nextBtn.click();
    await element.updateComplete;
    const nameField = element.shadowRoot?.querySelector(
      'oscd-filled-text-field[name="name"]'
    ) as any;
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
    const nextBtn = element.shadowRoot?.querySelector(
      'oscd-filled-button[data-testid="next-button"]'
    ) as HTMLElement;
    nextBtn.click();
    await element.updateComplete;
    const nameField = element.shadowRoot?.querySelector(
      'oscd-filled-text-field[name="name"]'
    ) as OscdFilledTextField;
    expect(nameField?.error).to.be.true;
    expect(nameField?.errorText).to.equal(
      'A Function with the name "F1" already exists'
    );
  });

  it('dispatches save event with correct details', async () => {
    const dispatchSpy = spy(element, 'dispatchEvent');
    element.name = 'F2';
    element.description = null;
    element.type = null;
    element.show();
    await element.updateComplete;
    const nextBtn = element.shadowRoot?.querySelector(
      'oscd-filled-button[data-testid="next-button"]'
    ) as HTMLElement;
    nextBtn.click();
    await element.updateComplete;
    await waitUntil(
      () => element.step === CreateFunctionDialogStep.FunctionContent,
      'Step did not advance to Function Content'
    );

    const saveBtn = element.shadowRoot?.querySelector(
      'oscd-filled-button[data-testid="save-button"]'
    ) as HTMLElement;
    saveBtn.click();
    await element.updateComplete;

    expect(dispatchSpy.calledWithMatch(sinon.match.has('type', 'save'))).to.be
      .true;
    const saveEvent = dispatchSpy
      .getCalls()
      .find(call => call.args[0].type === 'save')?.args[0] as CustomEvent;
    expect(saveEvent?.detail).to.deep.equal({
      name: 'F2',
      description: null,
      type: null,
      subfunctions: [],
      lnodes: [],
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

  it('closes dialog on Cancel confirmation', async () => {
    element.show();
    await element.updateComplete;
    const cancelBtn = element.shadowRoot?.querySelector(
      'oscd-filled-button[data-testid="cancel-button-step1"]'
    ) as HTMLElement;
    cancelBtn.click();
    await element.updateComplete;

    const confirmDialog = element.shadowRoot?.querySelector(
      'confirm-dialog'
    ) as any;
    expect(confirmDialog).to.exist;

    await confirmDialog.updateComplete;
    expect(confirmDialog.headline).to.equal('Cancel without saving?');
    expect(confirmDialog.variant).to.equal('danger');
    expect(confirmDialog.confirmLabel).to.equal('Yes, cancel');

    const confirmBtn = confirmDialog?.shadowRoot?.querySelector(
      'oscd-filled-button[data-testid="confirm-button"]'
    ) as HTMLElement;
    confirmBtn.click();
    await element.updateComplete;

    const mainDialog = element.shadowRoot?.querySelector(
      'oscd-dialog[id="create-function-dialog"]'
    ) as any;
    await waitUntil(
      () => !mainDialog.open,
      'Main dialog did not close after cancellation'
    );
    expect(mainDialog.open).to.be.false;
  });

  it('resets fields on close', async () => {
    element.name = 'F3';
    element.description = null;
    element.type = null;
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

  it('deletes selected subfunction', async () => {
    element.name = 'F4';
    element.show();
    await element.updateComplete;

    element.tempSubfunctions = [
      { name: 'SF1', description: null, type: null, lnodes: null },
      { name: 'SF2', description: null, type: null, lnodes: null },
    ];
    const nextBtn = element.shadowRoot?.querySelector(
      'oscd-filled-button[data-testid="next-button"]'
    ) as HTMLElement;
    nextBtn.click();
    await element.updateComplete;
    await waitUntil(
      () => element.step === CreateFunctionDialogStep.FunctionContent,
      'Step did not advance to Function Content'
    );

    const subfunctionsEditList = element.shadowRoot?.querySelector(
      'edit-list[title="SubFunctions"]'
    );

    const firstSubfunctionElement =
      subfunctionsEditList?.shadowRoot?.querySelector(
        'oscd-list-item[data-testid="edit-list-item-0"]'
      ) as HTMLElement;
    firstSubfunctionElement.click();
    await new Promise(r => {
      setTimeout(r, 0);
    });

    const deleteBtn = subfunctionsEditList?.shadowRoot?.querySelector(
      'oscd-icon-button[data-testid="edit-list-delete-button"]'
    ) as HTMLElement;
    deleteBtn.click();
    await element.updateComplete;

    const confirmBtn = element.confirmDialog.shadowRoot?.querySelector(
      'oscd-filled-button[data-testid="confirm-button"]'
    ) as HTMLElement;
    confirmBtn.click();
    await element.updateComplete;
    expect(element.tempSubfunctions).to.deep.equal([
      { name: 'SF2', description: null, type: null, lnodes: null },
    ]);
  });
});
