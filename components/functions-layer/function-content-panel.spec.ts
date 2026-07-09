/* eslint-disable no-unused-expressions */
import { html } from 'lit';
import { spy } from 'sinon';
import { fixture, expect } from '@open-wc/testing';

import { FunctionContentPanel } from './function-content-panel.js';
import {
  docWithBayAndFunctions,
  docWithNestedFunctions,
} from './functions-layer-testfiles.js';

if (!customElements.get('function-content-panel')) {
  customElements.define('function-content-panel', FunctionContentPanel);
}

describe('FunctionContentPanel', () => {
  let element: FunctionContentPanel;

  beforeEach(async () => {
    element = await fixture(
      html`<function-content-panel></function-content-panel>`
    );
  });

  function getFunctionElementFromDoc(docString: string): Element {
    const parser = new DOMParser();
    const doc = parser.parseFromString(docString, 'text/xml');
    const functionElement = doc.querySelector('Function');
    return functionElement!;
  }

  it('renders empty state when no functionElement is provided', async () => {
    const functionElement = getFunctionElementFromDoc(docWithBayAndFunctions);
    element.functionElement = functionElement;
    await element.updateComplete;

    const emptyState = element.shadowRoot?.querySelector('.empty-state');
    expect(emptyState).to.exist;
    expect(emptyState?.textContent).to.include('No SubFunctions or LNodes');
  });

  it('renders function name', async () => {
    const functionElement = getFunctionElementFromDoc(docWithBayAndFunctions);
    element.functionElement = functionElement;
    await element.updateComplete;

    const headerText = element.shadowRoot?.querySelector('.header-text h3');
    expect(headerText).to.exist;
    expect(headerText?.textContent).to.equal('F1');
  });

  it('renders SubFunctions and LNodes', async () => {
    const functionElement = getFunctionElementFromDoc(docWithNestedFunctions);
    element.functionElement = functionElement;
    await element.updateComplete;

    const subFunctionsList =
      element.shadowRoot?.querySelectorAll('oscd-list')[0];
    expect(subFunctionsList).to.exist;
    expect(
      subFunctionsList?.querySelectorAll('oscd-list-item').length
    ).to.equal(1);
    const subFunctionItem = subFunctionsList?.querySelector('oscd-list-item');
    expect(subFunctionItem).to.exist;
    expect(subFunctionItem?.textContent).to.include('SF1');

    const lNodesList = element.shadowRoot?.querySelectorAll('oscd-list')[1];
    expect(lNodesList).to.exist;
    expect(lNodesList?.querySelectorAll('oscd-list-item').length).to.equal(1);
    const lnodeItem = lNodesList?.querySelector('oscd-list-item');
    expect(lnodeItem).to.exist;
    expect(lnodeItem?.textContent).to.include('LLN0');
  });

  it('dispatches close event when close button is clicked', async () => {
    const functionElement = getFunctionElementFromDoc(docWithBayAndFunctions);
    element.functionElement = functionElement;
    await element.updateComplete;
    const spyEvent = spy();
    element.addEventListener('close', spyEvent);
    const closeButton = element.shadowRoot?.querySelector('.close-btn');
    expect(closeButton).to.exist;
    closeButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(spyEvent.calledOnce).to.be.true;
  });

  it('dispatches cancel-create-function-link when close is clicked in link mode', async () => {
    const functionElement = getFunctionElementFromDoc(docWithNestedFunctions);
    element.functionElement = functionElement;
    await element.updateComplete;

    const lNodeListItem = element.shadowRoot?.querySelector(
      'oscd-list:nth-of-type(2) oscd-list-item[type="button"]'
    ) as HTMLElement;
    lNodeListItem.click();
    await element.updateComplete;

    element.selectingLinkSource = true;
    await element.updateComplete;

    const cancelSpy = spy();
    element.addEventListener('cancel-create-function-link', cancelSpy);

    const closeButton = element.shadowRoot?.querySelector('.close-btn');
    closeButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(cancelSpy.calledOnce).to.be.true;
  });

  it('expands selected function-level LNode and shows action buttons', async () => {
    const functionElement = getFunctionElementFromDoc(docWithNestedFunctions);
    element.functionElement = functionElement;
    await element.updateComplete;

    const lNodeListItems = element.shadowRoot?.querySelectorAll(
      'oscd-list:nth-of-type(2) oscd-list-item'
    );
    expect(lNodeListItems?.length).to.equal(1);

    (lNodeListItems?.[0] as HTMLElement).click();
    await element.updateComplete;

    const createBtn = element.shadowRoot?.querySelector(
      '[data-testid="create-function-link-btn"]'
    );
    const incomingBtn = element.shadowRoot?.querySelector(
      '[data-testid="incoming-signal-btn"]'
    );
    const outgoingBtn = element.shadowRoot?.querySelector(
      '[data-testid="outgoing-signal-btn"]'
    );

    expect(createBtn).to.exist;
    expect(incomingBtn?.hasAttribute('disabled')).to.be.true;
    expect(outgoingBtn?.hasAttribute('disabled')).to.be.true;
  });

  it('dispatches sink context when create function link is pressed', async () => {
    const functionElement = getFunctionElementFromDoc(docWithNestedFunctions);
    element.functionElement = functionElement;
    await element.updateComplete;

    const lNodeListItem = element.shadowRoot?.querySelector(
      'oscd-list:nth-of-type(2) oscd-list-item'
    ) as HTMLElement;
    lNodeListItem.click();
    await element.updateComplete;

    const startSpy = spy();
    element.addEventListener('start-create-function-link', startSpy);

    const createBtn = element.shadowRoot?.querySelector(
      '[data-testid="create-function-link-btn"]'
    ) as HTMLElement;
    createBtn.click();
    await element.updateComplete;

    expect(startSpy.calledOnce).to.be.true;
    const { detail } = startSpy.firstCall.args[0];
    expect(detail.functionElement).to.equal(functionElement);
    expect(detail.subFunctionElement).to.equal(null);
    expect(detail.lNodeElement.getAttribute('lnClass')).to.equal('LLN0');
  });

  it('shows link selection prompt and cancel button when selecting source', async () => {
    const functionElement = getFunctionElementFromDoc(docWithNestedFunctions);
    element.functionElement = functionElement;
    element.selectingLinkSource = true;
    await element.updateComplete;

    const lNodeListItem = element.shadowRoot?.querySelector(
      'oscd-list:nth-of-type(2) oscd-list-item'
    ) as HTMLElement;
    lNodeListItem.click();
    await element.updateComplete;

    const hint = element.shadowRoot?.querySelector(
      '[data-testid="link-source-hint"]'
    );
    const cancelBtn = element.shadowRoot?.querySelector(
      '[data-testid="cancel-create-function-link-btn"]'
    );

    expect(hint?.textContent).to.include('Select a source Function');
    expect(cancelBtn).to.be.visible;
  });

  it('dispatches cancel-create-function-link when cancel is pressed', async () => {
    const functionElement = getFunctionElementFromDoc(docWithNestedFunctions);
    element.functionElement = functionElement;
    element.selectingLinkSource = true;
    await element.updateComplete;

    const lNodeListItem = element.shadowRoot?.querySelector(
      'oscd-list:nth-of-type(2) oscd-list-item'
    ) as HTMLElement;
    lNodeListItem.click();
    await element.updateComplete;

    const cancelSpy = spy();
    element.addEventListener('cancel-create-function-link', cancelSpy);

    const cancelBtn = element.shadowRoot?.querySelector(
      '[data-testid="cancel-create-function-link-btn"]'
    ) as HTMLElement;
    cancelBtn.click();
    await element.updateComplete;

    expect(cancelSpy.calledOnce).to.be.true;
  });

  it('supports create function link from subfunction LNode', async () => {
    const doc = new DOMParser().parseFromString(
      `<?xml version="1.0" encoding="UTF-8"?>
      <SCL xmlns="http://www.iec.ch/61850/2003/SCL" version="2007" revision="B">
        <Substation name="S1">
          <VoltageLevel name="V1">
            <Bay name="B1">
              <Function name="F1">
                <SubFunction name="SF1">
                  <LNode id="1" lnClass="CSWI" desc="Switch Controller"></LNode>
                </SubFunction>
              </Function>
            </Bay>
          </VoltageLevel>
        </Substation>
      </SCL>`,
      'text/xml'
    );

    element.functionElement = doc.querySelector('Function')!;
    await element.updateComplete;

    const subfunctionLNode = element.shadowRoot?.querySelector(
      'oscd-list:nth-of-type(1) oscd-list-item[type="button"]'
    ) as HTMLElement;
    subfunctionLNode.click();
    await element.updateComplete;

    const startSpy = spy();
    element.addEventListener('start-create-function-link', startSpy);

    const createBtn = element.shadowRoot?.querySelector(
      '[data-testid="create-function-link-btn"]'
    ) as HTMLElement;
    createBtn.click();

    expect(startSpy.calledOnce).to.be.true;
    const { detail } = startSpy.firstCall.args[0];
    expect(detail.subFunctionElement.getAttribute('name')).to.equal('SF1');
    expect(detail.lNodeElement.getAttribute('lnClass')).to.equal('CSWI');
  });

  it('resets link mode UI when a different LNode is selected', async () => {
    const doc = new DOMParser().parseFromString(
      `<?xml version="1.0" encoding="UTF-8"?>
      <SCL xmlns="http://www.iec.ch/61850/2003/SCL" version="2007" revision="B">
        <Substation name="S1">
          <VoltageLevel name="V1">
            <Bay name="B1">
              <Function name="F1">
                <SubFunction name="SF1">
                  <LNode id="1" lnClass="CSWI" desc="Switch Controller"></LNode>
                </SubFunction>
                <LNode id="2" lnClass="LLN0" desc="Logical Node 1"></LNode>
              </Function>
            </Bay>
          </VoltageLevel>
        </Substation>
      </SCL>`,
      'text/xml'
    );

    element.functionElement = doc.querySelector('Function')!;
    await element.updateComplete;

    const subfunctionLNode = element.shadowRoot?.querySelector(
      'oscd-list:nth-of-type(1) oscd-list-item[type="button"]'
    ) as HTMLElement;
    subfunctionLNode.click();
    await element.updateComplete;

    element.selectingLinkSource = true;
    await element.updateComplete;

    const cancelSpy = spy();
    element.addEventListener('cancel-create-function-link', cancelSpy);

    const functionLNode = element.shadowRoot?.querySelector(
      'oscd-list:nth-of-type(2) oscd-list-item[type="button"]'
    ) as HTMLElement;
    functionLNode.click();
    await element.updateComplete;

    const createBtn = element.shadowRoot?.querySelector(
      '[data-testid="create-function-link-btn"]'
    );
    const cancelBtn = element.shadowRoot?.querySelector(
      '[data-testid="cancel-create-function-link-btn"]'
    );
    const hint = element.shadowRoot?.querySelector(
      '[data-testid="link-source-hint"]'
    );

    expect(cancelSpy.calledOnce).to.be.true;
    expect(createBtn).to.exist;
    expect(cancelBtn).to.not.exist;
    expect(hint).to.not.exist;
  });
});
