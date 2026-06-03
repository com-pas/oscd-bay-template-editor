/* eslint-disable no-unused-expressions */
import { fixture, expect, html } from '@open-wc/testing';
import sinon from 'sinon';
import { ConfirmDialog } from './confirmation-dialog.js';

if (!customElements.get('confirm-dialog')) {
  customElements.define('confirm-dialog', ConfirmDialog);
}

describe('ConfirmDialog', () => {
  let element: ConfirmDialog;

  beforeEach(async () => {
    element = await fixture(html`<confirm-dialog></confirm-dialog>`);
    await element.updateComplete;
  });

  it('renders dialog with default properties', () => {
    const dialog = element.shadowRoot?.querySelector('oscd-dialog');
    expect(dialog).to.exist;
    expect(element.headline).to.equal('Are you sure?');
    expect(element.description).to.equal('');
    expect(element.confirmLabel).to.equal('Confirm');
    expect(element.cancelLabel).to.equal('Cancel');
    expect(element.icon).to.equal('');
    expect(element.variant).to.equal('danger');
  });

  it('shows and closes the dialog', async () => {
    const dialog = element.shadowRoot?.querySelector('oscd-dialog') as any;
    sinon.spy(dialog, 'show');
    sinon.spy(dialog, 'close');

    element.show();
    await element.updateComplete;
    expect(dialog.show.calledOnce).to.be.true;

    element.close();
    await element.updateComplete;
    expect(dialog.close.calledOnce).to.be.true;
  });

  it('emits confirm event on confirm click', async () => {
    const confirmSpy = sinon.spy();
    element.addEventListener('confirm-dialog-confirm', confirmSpy);

    const confirmButton = element.shadowRoot?.querySelector(
      'oscd-filled-button[data-testid="confirm-button"]'
    ) as HTMLElement;
    confirmButton.click();
    await element.updateComplete;

    expect(confirmSpy.calledOnce).to.be.true;
  });

  it('emits cancel event on cancel click', async () => {
    const cancelSpy = sinon.spy();
    element.addEventListener('confirm-dialog-cancel', cancelSpy);

    const cancelButton = element.shadowRoot?.querySelector(
      'oscd-filled-button[data-testid="cancel-button"]'
    ) as HTMLElement;
    cancelButton.click();
    await element.updateComplete;

    expect(cancelSpy.calledOnce).to.be.true;
  });
});
