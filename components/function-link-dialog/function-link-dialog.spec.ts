/* eslint-disable no-unused-expressions */
import { html } from 'lit';
import { fixture, expect, waitUntil } from '@open-wc/testing';
import { spy } from 'sinon';
import { FunctionLinkDialog } from './function-link-dialog.js';

if (!customElements.get('function-link-dialog')) {
  customElements.define('function-link-dialog', FunctionLinkDialog);
}

describe('FunctionLinkDialog', () => {
  let element: FunctionLinkDialog;

  beforeEach(async () => {
    element = await fixture(
      html`<function-link-dialog></function-link-dialog>`
    );
    await element.updateComplete;
  });

  it('dispatches close when dialog is closed', async () => {
    const closeSpy = spy();
    element.addEventListener('close-function-link-dialog', closeSpy);

    element.show();
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
    element.showForSourceFunction('F2', 'S1/V1/B1/F2');
    await element.updateComplete;
    await waitUntil(() => element.open);

    expect(element.sourceFunctionName).to.equal('F2');
    expect(element.sourceFunctionPath).to.equal('S1/V1/B1/F2');
  });
});
