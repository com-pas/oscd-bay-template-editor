/* eslint-disable no-unused-expressions */
import { html } from 'lit';
import sinon from 'sinon';
import { fixture, expect } from '@open-wc/testing';
import { FunctionLinkOverview } from './function-link-overview.js';
import { buildSourceRefKey, type FunctionLink } from './function-links.js';
import { docWithSourceRef } from '../../testfiles.js';

if (!customElements.get('function-link-overview')) {
  customElements.define('function-link-overview', FunctionLinkOverview);
}

describe('FunctionLinkOverview', () => {
  let element: FunctionLinkOverview;
  let doc: XMLDocument;

  beforeEach(async () => {
    doc = new DOMParser().parseFromString(docWithSourceRef, 'application/xml');
    const sourceFunction = doc.querySelector('Function[name="Source"]')!;
    const sinkFunction = doc.querySelector('Function[name="Sink"]')!;
    const sourceRefs = Array.from(
      doc.getElementsByTagNameNS(
        'http://www.iec.ch/61850/2019/SCL/6-100',
        'SourceRef'
      )
    );
    const link: FunctionLink = {
      id: 'Source|Sink|GOOSE',
      service: 'GOOSE',
      sourceFunction,
      sinkFunction,
      sourceRefs,
      parallelIndex: 0,
      parallelCount: 1,
    };
    element = await fixture(
      html`<function-link-overview
        .selectedLink=${link}
      ></function-link-overview>`
    );
    await element.updateComplete;
  });

  afterEach(() => {
    sinon.restore();
  });

  it('renders the selected link and its source references', () => {
    expect(
      element.shadowRoot?.querySelector(
        '[data-testid="function-link-overview"]'
      )
    ).to.exist;
    expect(
      element.shadowRoot?.querySelectorAll('[data-testid="link-level-1-row"]')
    ).to.have.length(1);
    expect(
      element.shadowRoot?.querySelectorAll('[data-testid="link-level-2-row"]')
    ).to.have.length(1);
    expect(element.shadowRoot?.textContent).to.include('Source');
    expect(element.shadowRoot?.textContent).to.include('GOOSE');
    expect(
      element.shadowRoot?.querySelector('.link-overview-description')
        ?.textContent
    ).to.not.equal(undefined);
  });

  it('toggles source reference details', async () => {
    const toggleSpy = sinon.spy();
    element.addEventListener('toggle-details', toggleSpy);
    const sourceButton = element.shadowRoot?.querySelector(
      '.link-overview-source-button'
    ) as HTMLButtonElement;
    sourceButton.click();

    expect(toggleSpy.calledOnce).to.be.true;
  });

  it('removes one pending source reference', async () => {
    const { sourceRefs } = element.selectedLink!;
    element.pendingRemovedSourceRefKeys = [buildSourceRefKey(sourceRefs[0])];
    await element.updateComplete;

    expect(
      element.shadowRoot?.querySelectorAll('[data-testid="link-level-2-row"]')
    ).to.have.length(0);
  });

  it('shows the delete warning when the link is pending deletion', async () => {
    element.pendingDelete = true;
    await element.updateComplete;

    const warning = element.shadowRoot?.querySelector(
      '[data-testid="link-overview-delete-warning"]'
    );
    expect(warning).to.exist;
    expect(warning?.textContent).to.include('This will delete the link');
    expect(warning?.textContent).to.include('Source');
    expect(warning?.textContent).to.include('Sink');
    expect(
      element.shadowRoot?.querySelector('[data-testid="link-level-1-row"]')
    ).to.not.exist;

    const saveButton = element.shadowRoot?.querySelector(
      '[data-testid="link-overview-save-button"]'
    ) as HTMLElement;
    expect(saveButton.textContent?.trim()).to.equal('Delete link');
    expect(saveButton.classList.contains('link-overview-danger-button')).to.be
      .true;
  });

  it('dispatches close and delete actions', () => {
    const actions = sinon.spy();
    ['close', 'delete-link', 'save'].forEach(action =>
      element.addEventListener(action, actions)
    );

    (
      element.shadowRoot!.querySelector(
        '[data-testid="link-overview-cancel-button"]'
      ) as HTMLElement
    ).click();
    (
      element.shadowRoot!.querySelector(
        '[data-testid="main-row-delete-button"]'
      ) as HTMLElement
    ).click();
    expect(actions.callCount).to.equal(2);
  });

  it('dispatches the source-reference delete action', () => {
    const listener = sinon.spy();
    element.addEventListener('delete-source-ref', listener);

    element
      .shadowRoot!.querySelector('[data-testid="detail-row-delete-button"]')!
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(listener.calledOnce).to.be.true;
    expect(listener.firstCall.args[0].detail).to.equal(
      element.selectedLink!.sourceRefs[0]
    );
  });
});
