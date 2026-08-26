/* eslint-disable no-unused-expressions */
import { html } from 'lit';
import { fixture, expect, waitUntil } from '@open-wc/testing';
import { spy } from 'sinon';
import { FunctionLinkDialog } from './function-link-dialog.js';
import { docWithSubFunctionLNode } from '../../testfiles.js';

if (!customElements.get('function-link-dialog')) {
  customElements.define('function-link-dialog', FunctionLinkDialog);
}

describe('FunctionLinkDialog', () => {
  let element: FunctionLinkDialog;
  let doc: XMLDocument;
  let sourceFunction: Element;

  beforeEach(async () => {
    doc = new DOMParser().parseFromString(
      docWithSubFunctionLNode,
      'application/xml'
    );
    sourceFunction = doc.querySelector('Function[name="TEST2"]')!;

    element = await fixture(
      html`<function-link-dialog></function-link-dialog>`
    );
    await element.updateComplete;
  });

  it('dispatches close when dialog is closed', async () => {
    const closeSpy = spy();
    element.addEventListener('close-function-link-dialog', closeSpy);

    element.showForSourceFunction(sourceFunction, doc);
    await element.updateComplete;
    await waitUntil(() => element.open);

    const closeButton = element.shadowRoot?.querySelector(
      '[data-testid="close-button"]'
    ) as HTMLButtonElement;

    closeButton.click();
    await element.updateComplete;
    await waitUntil(() => closeSpy.called, 'close event was not dispatched', {
      timeout: 2000,
    });
    expect(closeSpy.calledOnce).to.be.true;
  });

  it('opens with source function details', async () => {
    element.showForSourceFunction(sourceFunction, doc);
    await element.updateComplete;
    await waitUntil(() => element.open);

    expect(element.sourceFunctionName).to.equal('TEST2');
    expect(element.sourceFunctionPath).to.equal('S1/V1/B2/TEST2');
  });

  it('keeps connect disabled until both service and reference are selected', async () => {
    element.showForSourceFunction(sourceFunction, doc);
    await element.updateComplete;

    const connectButton = element.shadowRoot?.querySelector(
      '[data-testid="connect-button"]'
    ) as HTMLButtonElement;
    expect(connectButton.disabled).to.be.true;

    const checkbox = element.shadowRoot?.querySelector(
      'input[type="checkbox"]'
    ) as HTMLInputElement;
    checkbox.click();
    await element.updateComplete;
    expect(connectButton.disabled).to.be.true;

    const serviceSelect = element.shadowRoot?.querySelector(
      '[data-testid="service-select"]'
    ) as HTMLSelectElement;
    serviceSelect.value = 'GOOSE';
    serviceSelect.dispatchEvent(new Event('change'));
    await element.updateComplete;

    expect(connectButton.disabled).to.be.false;
  });

  it('dispatches create-function-link with selected references and service', async () => {
    const createSpy = spy();
    element.addEventListener('create-function-link', createSpy);

    element.showForSourceFunction(sourceFunction, doc);
    await element.updateComplete;

    const checkbox = element.shadowRoot?.querySelector(
      'input[type="checkbox"]'
    ) as HTMLInputElement;
    checkbox.click();

    const serviceSelect = element.shadowRoot?.querySelector(
      '[data-testid="service-select"]'
    ) as HTMLSelectElement;
    serviceSelect.value = 'SMV';
    serviceSelect.dispatchEvent(new Event('change'));
    await element.updateComplete;

    const connectButton = element.shadowRoot?.querySelector(
      '[data-testid="connect-button"]'
    ) as HTMLButtonElement;
    connectButton.click();
    await element.updateComplete;

    expect(createSpy.calledOnce).to.be.true;
    const { detail } = createSpy.firstCall.args[0] as CustomEvent;
    expect(detail.service).to.equal('SMV');
    expect(detail.selectedReferences).to.have.length(1);
    expect(detail.selectedReferences[0].fullSource).to.match(
      /^S1\/V1\/B2\/TEST2\//
    );
  });

  it('shows a clear button for search and clears the query when clicked', async () => {
    element.showForSourceFunction(sourceFunction, doc);
    await element.updateComplete;

    const searchField = element.shadowRoot?.querySelector(
      '.search-field'
    ) as HTMLInputElement;
    searchField.value = 'Pos';
    searchField.dispatchEvent(new Event('input'));
    await element.updateComplete;

    const clearButton = element.shadowRoot?.querySelector(
      '[data-testid="clear-search-button"]'
    ) as HTMLButtonElement;
    expect(clearButton).to.exist;

    clearButton.click();
    await element.updateComplete;

    const updatedSearchField = element.shadowRoot?.querySelector(
      '.search-field'
    ) as HTMLInputElement;
    expect(updatedSearchField.value).to.equal('');
    expect(
      element.shadowRoot?.querySelector('[data-testid="clear-search-button"]')
    ).to.not.exist;
  });

  it('prevents escape and cancel from closing the dialog', async () => {
    element.showForSourceFunction(sourceFunction, doc);
    await element.updateComplete;
    await waitUntil(() => element.open);

    const escapeEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    const escapeNotCanceled = document.dispatchEvent(escapeEvent);

    expect(escapeNotCanceled).to.be.false;
    expect(element.open).to.be.true;

    const dialog = element.shadowRoot?.querySelector('oscd-dialog')!;
    const cancelNotCanceled = dialog.dispatchEvent(
      new Event('cancel', { bubbles: true, cancelable: true })
    );

    expect(cancelNotCanceled).to.be.false;
    expect(element.open).to.be.true;
  });
});
