/* eslint-disable no-unused-expressions */
import { html } from 'lit';
import { fixture, expect } from '@open-wc/testing';
import BayTemplatePlugin from './bay-template-editor.js';

const sampleDocString = `<?xml version="1.0" encoding="UTF-8"?>
<SCL xmlns="http://www.iec.ch/61850/2003/SCL" version="2007" revision="B">
  <Substation name="S1">
    <VoltageLevel name="V1">
      <Bay name="B1" />
    </VoltageLevel>
  </Substation>
</SCL>`;

if (!customElements.get('oscd-editor-bay-template')) {
  customElements.define('oscd-editor-bay-template', BayTemplatePlugin);
}

describe('BayTemplatePlugin', () => {
  let element: BayTemplatePlugin;

  beforeEach(async () => {
    element = await fixture(
      html`<oscd-editor-bay-template></oscd-editor-bay-template>`
    );
    await element.updateComplete;
  });

  it('shows a placeholder message when no document is loaded', async () => {
    await element.updateComplete;
    expect(element.shadowRoot?.querySelector('p')).to.contain.text(
      'Please open an SCL document'
    );
  });

  it('renders sld-editor when doc is set', async () => {
    const doc = new DOMParser().parseFromString(
      sampleDocString,
      'application/xml'
    );
    element.doc = doc;
    await element.updateComplete;
    expect(element.shadowRoot?.querySelector('sld-editor')).to.exist;
  });

  it('passes doc, editCount, gridSize, to sld-editor', async () => {
    const doc = new DOMParser().parseFromString(
      sampleDocString,
      'application/xml'
    );
    element.doc = doc;
    element.editCount = 2;
    element.gridSize = 64;
    await element.updateComplete;
    const sldEditor = element.shadowRoot?.querySelector('sld-editor') as any;
    expect(sldEditor).to.exist;
    expect(sldEditor?.doc).to.equal(doc);
    expect(sldEditor?.editCount).to.equal(2);
    expect(sldEditor?.gridSize).to.equal(64);
  });

  it('applies correct styles to host and sld-editor', async () => {
    const styles = getComputedStyle(element);
    await element.updateComplete;
    expect(['block', 'inline']).to.include(styles.display);
    const sldEditor = element.shadowRoot?.querySelector('sld-editor') as any;
    if (sldEditor) {
      const sldStyles = getComputedStyle(sldEditor);
      expect(['block', 'inline']).to.include(sldStyles.display);
    }
  });
});
