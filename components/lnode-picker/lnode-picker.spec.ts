/* eslint-disable no-unused-expressions */
import { fixture, expect, html } from '@open-wc/testing';
import sinon from 'sinon';
import { LNodePicker } from './lnode-picker.js';

if (!customElements.get('lnode-picker')) {
  customElements.define('lnode-picker', LNodePicker);
}

describe('LNodePicker', () => {
  let element: LNodePicker;
  let library: Document;

  beforeEach(async () => {
    library = new DOMParser().parseFromString(
      `<?xml version="1.0" encoding="UTF-8"?>
            <SCL>
                <DataTypeTemplates>
                    <LNodeType lnClass="TVTR" desc="Voltage Transformer" id="TVTR$oscd$_a0be960c8dfd3708" />
                    <LNodeType lnClass="TCTR" desc="Current Transformer" id="TCTR$oscd$_defaa767081f017d" />
                    <LNodeType lnClass="XSWI" desc="Switch" id="XSWI$oscd$_74c3c9de7d5cdfad" />
                    <LNodeType lnClass="XCBR" desc="Circuit Breaker" id="XCBR$oscd$_b8418061c0b79b58" />
                </DataTypeTemplates>
            </SCL>`,
      'application/xml'
    );
    element = await fixture(
      html`<lnode-picker .library=${library} .existingIds=${[]}></lnode-picker>`
    );
    await element.updateComplete;
  });

  it('renders search field and list', () => {
    expect(element.shadowRoot?.querySelector('oscd-filled-text-field')).to
      .exist;
    expect(element.shadowRoot?.querySelector('oscd-list')).to.exist;
  });

  it('emits lnode-picker-confirm with selected entries on confirm', async () => {
    const confirmSpy = sinon.spy();
    element.addEventListener('lnode-picker-confirm', confirmSpy);
    element.dispatchEvent(
      new CustomEvent('lnode-picker-confirm', {
        detail: { selected: ['entry1', 'entry2'] },
      })
    );
    expect(confirmSpy.calledOnce).to.be.true;
    expect(confirmSpy.args[0][0].detail.selected).to.deep.equal([
      'entry1',
      'entry2',
    ]);
  });

  it('filters entries based on search query', async () => {
    const searchField = element.shadowRoot?.querySelector(
      'oscd-filled-text-field'
    ) as any;
    searchField.value = 'Transformer';
    searchField.dispatchEvent(new Event('input'));
    await element.updateComplete;

    const listItems = element.shadowRoot?.querySelectorAll('oscd-list-item');
    expect(listItems?.length).to.equal(2);
    expect(listItems?.[0].textContent).to.include('Voltage Transformer');
    expect(listItems?.[1].textContent).to.include('Current Transformer');
  });

  it('does not allow selection of existing IDs', async () => {
    element.existingIds = ['TVTR$oscd$_a0be960c8dfd3708'];
    await element.updateComplete;

    const listItems = element.shadowRoot?.querySelectorAll('oscd-list-item');
    expect(listItems?.[0].hasAttribute('disabled')).to.be.true;
    expect(listItems?.[1].hasAttribute('disabled')).to.be.false;
  });
});
