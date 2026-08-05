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
  let doc: XMLDocument;
  let sourceFunction: Element;

  beforeEach(async () => {
    doc = new DOMParser().parseFromString(
      `<?xml version="1.0" encoding="UTF-8"?>
      <SCL xmlns="http://www.iec.ch/61850/2003/SCL" version="2007" revision="B">
        <Substation name="S1">
          <VoltageLevel name="V1">
            <Bay name="B2">
              <Function name="TEST2">
                <LNode lnClass="XSWI" lnInst="1" lnType="XSWI_TYPE"/>
                <SubFunction name="ESF1">
                  <LNode lnClass="TCTR" lnInst="1" lnType="TCTR_TYPE"/>
                </SubFunction>
              </Function>
            </Bay>
          </VoltageLevel>
        </Substation>
        <DataTypeTemplates>
          <LNodeType id="XSWI_TYPE" lnClass="XSWI">
            <DO name="Pos" type="DOT_POS"/>
            <DO name="Loc" type="DOT_LOC"/>
          </LNodeType>
          <LNodeType id="TCTR_TYPE" lnClass="TCTR">
            <DO name="Amp" type="DOT_AMP"/>
          </LNodeType>
          <DOType id="DOT_POS" cdc="DPC">
            <DA name="stVal" bType="Enum" fc="ST"/>
            <DA name="q" bType="Quality" fc="ST"/>
          </DOType>
          <DOType id="DOT_LOC" cdc="SPC">
            <DA name="stVal" bType="BOOLEAN" fc="ST"/>
          </DOType>
          <DOType id="DOT_AMP" cdc="MV">
            <SDO name="instMag" type="DOT_MAG"/>
            <DA name="q" bType="Quality" fc="MX"/>
          </DOType>
          <DOType id="DOT_MAG" cdc="MV">
            <DA name="f" bType="FLOAT32" fc="MX"/>
          </DOType>
        </DataTypeTemplates>
      </SCL>`,
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
