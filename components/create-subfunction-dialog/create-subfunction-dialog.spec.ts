/* eslint-disable no-unused-expressions */
import { fixture, expect, html, waitUntil } from '@open-wc/testing';
import { spy } from 'sinon';
import { OscdFilledTextField } from '@omicronenergy/oscd-ui/textfield/OscdFilledTextField.js';
import {
  CreateSubfunctionDialog,
  CreateSubfunctionDialogStep,
} from './create-subfunction-dialog.js';
import { emptyDoc, docWithSubFunctionSourceLink } from '../../testfiles.js';

if (!customElements.get('add-subfunction-dialog')) {
  customElements.define('add-subfunction-dialog', CreateSubfunctionDialog);
}

describe('CreateSubfunctionDialog', () => {
  let element: CreateSubfunctionDialog;
  let doc: XMLDocument;

  beforeEach(async () => {
    doc = new DOMParser().parseFromString(emptyDoc, 'application/xml');
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
    element.siblingSubFunctions = [
      {
        id: 'SF1',
        name: 'SF1',
        description: 'desc',
        type: 'type',
        lnodes: [],
      },
    ];
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

  it('shows next step on valid input and button click', async () => {
    element.name = 'SF2';
    element.show();
    await element.updateComplete;
    const nextBtn = element.shadowRoot?.querySelector(
      'oscd-filled-button[data-testid="next-button"]'
    ) as HTMLElement;
    nextBtn.click();
    await element.updateComplete;
    expect(element.step).to.equal(
      CreateSubfunctionDialogStep.SubfunctionContent
    );
  });

  it('closes dialog on Cancel confirmation', async () => {
    element.show();
    await element.updateComplete;
    const cancelBtn = element.shadowRoot?.querySelector(
      'oscd-filled-button[data-testid="cancel-button"]'
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
      'oscd-dialog[id="create-subfunction-dialog"]'
    ) as any;
    await waitUntil(
      () => !mainDialog.open,
      'Main dialog did not close after cancellation'
    );
    expect(mainDialog.open).to.be.false;
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

  describe('editing an existing SubFunction', () => {
    function setupLinkedSubFunction() {
      const linkedDoc = new DOMParser().parseFromString(
        docWithSubFunctionSourceLink,
        'application/xml'
      );
      const subFunction = linkedDoc.querySelector('SubFunction[name="sf1"]')!;
      const lnode = subFunction.querySelector('LNode')!;
      return { subFunction, lnode };
    }

    it('prefills fields and shows an Edit headline', async () => {
      const { subFunction, lnode } = setupLinkedSubFunction();
      element.editingSubFunction = {
        id: 'sf1',
        name: 'sf1',
        description: 'desc',
        type: 'type',
        lnodes: [lnode],
        element: subFunction,
      };
      element.show();
      await element.updateComplete;

      expect(element.name).to.equal('sf1');
      expect(element.description).to.equal('desc');
      expect(element.type).to.equal('type');
      expect((element as any).lnodes).to.deep.equal([lnode]);

      const headline = element.shadowRoot?.querySelector('[slot="headline"]');
      expect(headline?.textContent).to.contain('Edit');
    });

    it('asks for confirmation before removing an LNode that is part of a link, and removes it once confirmed', async () => {
      const { subFunction, lnode } = setupLinkedSubFunction();
      element.editingSubFunction = {
        id: 'sf1',
        name: 'sf1',
        description: null,
        type: null,
        lnodes: [lnode],
        element: subFunction,
      };
      element.show();
      await element.updateComplete;
      const nextBtn = element.shadowRoot?.querySelector(
        'oscd-filled-button[data-testid="next-button"]'
      ) as HTMLElement;
      nextBtn.click();
      await element.updateComplete;

      (element as any).selectedLNode = lnode;
      (element as any).handleRemoveLNode();
      await element.updateComplete;

      const confirmDialog = element.shadowRoot?.querySelector(
        'confirm-dialog'
      ) as any;
      await confirmDialog.updateComplete;
      expect(confirmDialog.headline).to.equal('Delete LNode?');

      const confirmBtn = confirmDialog.shadowRoot?.querySelector(
        'oscd-filled-button[data-testid="confirm-button"]'
      ) as HTMLElement;
      confirmBtn.click();
      await element.updateComplete;

      expect((element as any).lnodes).to.deep.equal([]);
    });

    it('keeps the LNode when the deletion confirmation is cancelled', async () => {
      const { subFunction, lnode } = setupLinkedSubFunction();
      element.editingSubFunction = {
        id: 'sf1',
        name: 'sf1',
        description: null,
        type: null,
        lnodes: [lnode],
        element: subFunction,
      };
      element.show();
      await element.updateComplete;
      const nextBtn = element.shadowRoot?.querySelector(
        'oscd-filled-button[data-testid="next-button"]'
      ) as HTMLElement;
      nextBtn.click();
      await element.updateComplete;

      (element as any).selectedLNode = lnode;
      (element as any).handleRemoveLNode();
      await element.updateComplete;

      const confirmDialog = element.shadowRoot?.querySelector(
        'confirm-dialog'
      ) as any;
      await confirmDialog.updateComplete;

      const cancelBtn = confirmDialog.shadowRoot?.querySelector(
        'oscd-filled-button[data-testid="cancel-button"]'
      ) as HTMLElement;
      cancelBtn.click();
      await element.updateComplete;

      expect((element as any).lnodes).to.deep.equal([lnode]);
    });

    it('removes an unlinked LNode immediately without confirmation', async () => {
      const doc2 = new DOMParser().parseFromString(emptyDoc, 'application/xml');
      const lnodeType = doc2.createElement('LNodeType');
      lnodeType.setAttribute('id', 'NEW_TYPE');
      lnodeType.setAttribute('lnClass', 'XSWI');

      element.editingSubFunction = null;
      element.show();
      await element.updateComplete;
      const nextBtn = element.shadowRoot?.querySelector(
        'oscd-filled-button[data-testid="next-button"]'
      ) as HTMLElement;
      nextBtn.click();
      await element.updateComplete;

      (element as any).lnodes = [lnodeType];
      (element as any).selectedLNode = lnodeType;
      (element as any).handleRemoveLNode();
      await element.updateComplete;

      expect((element as any).lnodes).to.deep.equal([]);
      expect(element.shadowRoot?.querySelector('confirm-dialog[open]')).to.not
        .exist;
    });

    it('dispatches the original element on save', async () => {
      const { subFunction, lnode } = setupLinkedSubFunction();
      element.editingSubFunction = {
        id: 'sf1',
        name: 'sf1',
        description: null,
        type: null,
        lnodes: [lnode],
        element: subFunction,
      };
      element.show();
      await element.updateComplete;
      const nextBtn = element.shadowRoot?.querySelector(
        'oscd-filled-button[data-testid="next-button"]'
      ) as HTMLElement;
      nextBtn.click();
      await element.updateComplete;

      const dispatchSpy = spy(element, 'dispatchEvent');
      const saveBtn = element.shadowRoot?.querySelector(
        'oscd-filled-button[data-testid="save-button"]'
      ) as HTMLElement;
      saveBtn.click();

      const saveEvent = dispatchSpy
        .getCalls()
        .find(call => call.args[0].type === 'save-subfunction')
        ?.args[0] as CustomEvent;
      expect(saveEvent?.detail.element).to.equal(subFunction);
      expect(saveEvent?.detail.lnodes).to.deep.equal([lnode]);
    });
  });
});
