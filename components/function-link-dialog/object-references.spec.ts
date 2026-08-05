/* eslint-disable no-unused-expressions */
import { expect } from '@open-wc/testing';
import {
  buildObjectReferences,
  buildSourceRefAttributes,
  filterObjectReferenceGroups,
  selectedReferencesSummary,
} from './object-references.js';

describe('object-references helpers', () => {
  let doc: XMLDocument;
  let sourceFunction: Element;

  beforeEach(() => {
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
          </LNodeType>
          <LNodeType id="TCTR_TYPE" lnClass="TCTR">
            <DO name="Amp" type="DOT_AMP"/>
          </LNodeType>
          <DOType id="DOT_POS" cdc="DPC">
            <DA name="stVal" bType="Enum" fc="ST"/>
          </DOType>
          <DOType id="DOT_AMP" cdc="MV">
            <SDO name="instMag" type="DOT_MAG"/>
          </DOType>
          <DOType id="DOT_MAG" cdc="MV">
            <DA name="f" bType="FLOAT32" fc="MX"/>
          </DOType>
        </DataTypeTemplates>
      </SCL>`,
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

    expect(groups[1].items[0].shortPath).to.equal('Amp.instMag.f');
    expect(groups[1].items[0].fullSource).to.equal(
      'S1/V1/B2/TEST2/ESF1/TCTR1.Amp.instMag.f'
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

    expect(attrs.source).to.equal('S1/V1/B2/TEST2/ESF1/TCTR1.Amp.instMag.f');
    expect(attrs.input).to.equal('TCTR1.Amp.instMag.f');
    expect(attrs.pLN).to.equal('TCTR');
    expect(attrs.pDO).to.equal('Amp');
    expect(attrs.pDA).to.equal('instMag.f');
  });

  it('formats selected count summary text', () => {
    expect(selectedReferencesSummary(0)).to.equal('No references selected');
    expect(selectedReferencesSummary(1)).to.equal('1 reference selected');
    expect(selectedReferencesSummary(3)).to.equal('3 references selected');
  });
});
