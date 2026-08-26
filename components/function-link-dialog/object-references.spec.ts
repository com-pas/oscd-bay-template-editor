/* eslint-disable no-unused-expressions */
import { expect } from '@open-wc/testing';
import {
  buildObjectReferences,
  buildSourceRefAttributes,
  filterObjectReferenceGroups,
  selectedReferencesSummary,
} from './object-references.js';
import { docWithSubFunctionLNode } from '../../testfiles.js';

describe('object-references helpers', () => {
  let doc: XMLDocument;
  let sourceFunction: Element;

  beforeEach(() => {
    doc = new DOMParser().parseFromString(
      docWithSubFunctionLNode,
      'application/xml'
    );
    sourceFunction = doc.querySelector('Function[name="TEST2"]')!;
  });

  it('builds grouped object references from function and subfunction LNodes', () => {
    const groups = buildObjectReferences(sourceFunction, doc);

    expect(groups.length).to.equal(2);
    expect(groups[0].label).to.equal('XSWI1 · function level');
    expect(groups[1].label).to.equal('TCTR1 · subfunction ESF1');

    expect(groups[0].items[0].shortPath).to.equal('Pos.stVal');
    expect(groups[0].items[0].fullSource).to.equal(
      'S1/V1/B2/TEST2/XSWI1.Pos.stVal'
    );

    expect(groups[1].items[0].shortPath).to.equal('Amp.q');
    expect(groups[1].items[0].fullSource).to.equal(
      'S1/V1/B2/TEST2/ESF1/TCTR1.Amp.q'
    );
  });

  it('filters groups by group header and item label text', () => {
    const groups = buildObjectReferences(sourceFunction, doc);

    const byGroup = filterObjectReferenceGroups(groups, 'subfunction esf1');
    expect(byGroup.length).to.equal(1);
    expect(byGroup[0].label).to.include('subfunction ESF1');

    const byItem = filterObjectReferenceGroups(groups, 'Pos.stVal');
    expect(byItem.length).to.equal(1);
    expect(byItem[0].items[0].shortPath).to.equal('Pos.stVal');
  });

  it('derives SourceRef attributes from selected references', () => {
    const groups = buildObjectReferences(sourceFunction, doc);
    const selectedRef = groups[1].items[0];

    const attrs = buildSourceRefAttributes(selectedRef);

    expect(attrs.source).to.equal('S1/V1/B2/TEST2/ESF1/TCTR1.Amp.q');
    expect(attrs.input).to.equal('TCTR1.Amp.q');
    expect(attrs.pLN).to.equal('TCTR');
    expect(attrs.pDO).to.equal('Amp');
    expect(attrs.pDA).to.equal('q');
  });

  it('formats selected count summary text', () => {
    expect(selectedReferencesSummary(0)).to.equal('No references selected');
    expect(selectedReferencesSummary(1)).to.equal('1 reference selected');
    expect(selectedReferencesSummary(3)).to.equal('3 references selected');
  });
});
