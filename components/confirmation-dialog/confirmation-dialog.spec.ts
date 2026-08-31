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

  it('applies the passed options', async () => {
    element.show({
      headline: 'Delete?',
      description: 'This cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Keep',
      icon: 'delete',
      variant: 'warning',
    });
    await element.updateComplete;

    expect(element.headline).to.equal('Delete?');
    expect(element.description).to.equal('This cannot be undone.');
    expect(element.confirmLabel).to.equal('Delete');
    expect(element.cancelLabel).to.equal('Keep');
    expect(element.icon).to.equal('delete');
    expect(element.variant).to.equal('warning');
  });

  it('resolves the promise with true on confirm click', async () => {
    const resultPromise = element.show();

    const confirmButton = element.shadowRoot?.querySelector(
      'oscd-filled-button[data-testid="confirm-button"]'
    ) as HTMLElement;
    confirmButton.click();
    await element.updateComplete;

    expect(await resultPromise).to.be.true;
  });

  it('resolves the promise with false on cancel click', async () => {
    const resultPromise = element.show();

    const cancelButton = element.shadowRoot?.querySelector(
      'oscd-filled-button[data-testid="cancel-button"]'
    ) as HTMLElement;
    cancelButton.click();
    await element.updateComplete;

    expect(await resultPromise).to.be.false;
  });
});
