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

  it('removes one pending source reference locally when its delete button is clicked', async () => {
    (
      element.shadowRoot!.querySelector(
        '[data-testid="detail-row-delete-button"]'
      ) as HTMLElement
    ).click();
    await element.updateComplete;

    expect(
      element.shadowRoot?.querySelectorAll('[data-testid="link-level-2-row"]')
    ).to.have.length(0);
  });

  it('shows the delete warning when the delete-link button is clicked', async () => {
    (
      element.shadowRoot!.querySelector(
        '[data-testid="main-row-delete-button"]'
      ) as HTMLElement
    ).click();
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

  it('dispatches a close action without pending-delete details when cancel is clicked', () => {
    const closeSpy = sinon.spy();
    const saveSpy = sinon.spy();
    element.addEventListener('close', closeSpy);
    element.addEventListener('save', saveSpy);

    (
      element.shadowRoot!.querySelector(
        '[data-testid="main-row-delete-button"]'
      ) as HTMLElement
    ).click();
    (
      element.shadowRoot!.querySelector(
        '[data-testid="link-overview-cancel-button"]'
      ) as HTMLElement
    ).click();

    expect(closeSpy.calledOnce).to.be.true;
    expect(saveSpy.called).to.be.false;
  });

  it('dispatches a save action with the pending whole-link deletion', async () => {
    const saveSpy = sinon.spy();
    element.addEventListener('save', saveSpy);

    (
      element.shadowRoot!.querySelector(
        '[data-testid="main-row-delete-button"]'
      ) as HTMLElement
    ).click();
    await element.updateComplete;
    (
      element.shadowRoot!.querySelector(
        '[data-testid="link-overview-save-button"]'
      ) as HTMLElement
    ).click();

    expect(saveSpy.calledOnce).to.be.true;
    expect(saveSpy.firstCall.args[0].detail).to.deep.equal({
      deleteWholeLink: true,
      removedSourceRefKeys: [],
    });
  });

  it('dispatches a save action with the pending source-reference deletions', async () => {
    const saveSpy = sinon.spy();
    element.addEventListener('save', saveSpy);
    const sourceRefKey = buildSourceRefKey(element.selectedLink!.sourceRefs[0]);

    (
      element.shadowRoot!.querySelector(
        '[data-testid="detail-row-delete-button"]'
      ) as HTMLElement
    ).click();
    await element.updateComplete;
    (
      element.shadowRoot!.querySelector(
        '[data-testid="link-overview-save-button"]'
      ) as HTMLElement
    ).click();

    expect(saveSpy.calledOnce).to.be.true;
    expect(saveSpy.firstCall.args[0].detail).to.deep.equal({
      deleteWholeLink: true,
      removedSourceRefKeys: [sourceRefKey],
    });
  });
});
