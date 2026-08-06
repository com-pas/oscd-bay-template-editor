import { expect } from '@open-wc/testing';
import type { EditV2 } from '@openscd/oscd-api';
import { buildFunctionLinkEdits } from './link-edits.js';
import { eTr6100Ns, eTr6100PrivType } from '../../util.js';

function isCreateEdit(edit: EditV2): edit is EditV2 & { node: Node } {
  return 'node' in edit;
}

describe('link-edits helpers', () => {
  it('creates Private, LNodeInputs and SourceRef edits for a new link', () => {
    const doc = new DOMParser().parseFromString(
      `<?xml version="1.0" encoding="UTF-8"?>
      <SCL xmlns="http://www.iec.ch/61850/2003/SCL" version="2007" revision="B">
        <Substation name="S1">
          <VoltageLevel name="V1">
            <Bay name="B1">
              <Function name="Sink">
                <LNode lnClass="CSWI" lnInst="1" />
              </Function>
            </Bay>
          </VoltageLevel>
        </Substation>
      </SCL>`,
      'application/xml'
    );

    const sinkLNode = doc.querySelector('Function[name="Sink"] > LNode')!;

    const edits = buildFunctionLinkEdits({
      doc,
      sinkLNode,
      service: 'GOOSE',
      namespacePrefix: 'eIEC61850-6-100',
      selectedReferences: [
        {
          id: 'ref-1',
          groupKey: 'function|TCTR1',
          groupLabel: 'TCTR1 function level',
          lnodeName: 'TCTR1',
          lnClass: 'TCTR',
          lnInst: '1',
          doName: 'Amp',
          daPath: 'instMag.f',
          shortPath: 'Amp.instMag.f',
          fullSource: 'S1/V1/B1/Source/TCTR1.Amp.instMag.f',
        },
      ],
    });

    const createEdits = edits.filter(isCreateEdit);
    expect(createEdits.length).to.equal(3);

    const privateElement = createEdits[0].node as Element;
    const lNodeInputsElement = createEdits[1].node as Element;
    const sourceRefElement = createEdits[2].node as Element;

    expect(privateElement.tagName).to.equal('Private');
    expect(privateElement.getAttribute('type')).to.equal(eTr6100PrivType);
    expect(lNodeInputsElement.localName).to.equal('LNodeInputs');
    expect(lNodeInputsElement.namespaceURI).to.equal(eTr6100Ns);

    expect(sourceRefElement.localName).to.equal('SourceRef');
    expect(sourceRefElement.namespaceURI).to.equal(eTr6100Ns);
    expect(sourceRefElement.getAttribute('service')).to.equal('GOOSE');
    expect(sourceRefElement.getAttribute('source')).to.equal(
      'S1/V1/B1/Source/TCTR1.Amp.instMag.f'
    );
    expect(sourceRefElement.getAttribute('input')).to.equal(
      'TCTR1.Amp.instMag.f'
    );
  });

  it('does not create edits for duplicate source/service combinations', () => {
    const doc = new DOMParser().parseFromString(
      `<?xml version="1.0" encoding="UTF-8"?>
      <SCL xmlns="http://www.iec.ch/61850/2003/SCL" version="2007" revision="B">
        <Substation name="S1">
          <VoltageLevel name="V1">
            <Bay name="B1">
              <Function name="Sink">
                <LNode lnClass="CSWI" lnInst="1">
                  <Private type="eIEC61850-6-100">
                    <eIEC61850-6-100:LNodeInputs xmlns:eIEC61850-6-100="http://www.iec.ch/61850/2019/SCL/6-100">
                      <eIEC61850-6-100:SourceRef
                        source="S1/V1/B1/Source/TCTR1.Amp.instMag.f"
                        service="GOOSE"
                      />
                    </eIEC61850-6-100:LNodeInputs>
                  </Private>
                </LNode>
              </Function>
            </Bay>
          </VoltageLevel>
        </Substation>
      </SCL>`,
      'application/xml'
    );

    const sinkLNode = doc.querySelector('Function[name="Sink"] > LNode')!;

    const edits = buildFunctionLinkEdits({
      doc,
      sinkLNode,
      service: 'GOOSE',
      namespacePrefix: 'eIEC61850-6-100',
      selectedReferences: [
        {
          id: 'ref-1',
          groupKey: 'function|TCTR1',
          groupLabel: 'TCTR1 function level',
          lnodeName: 'TCTR1',
          lnClass: 'TCTR',
          lnInst: '1',
          doName: 'Amp',
          daPath: 'instMag.f',
          shortPath: 'Amp.instMag.f',
          fullSource: 'S1/V1/B1/Source/TCTR1.Amp.instMag.f',
        },
      ],
    });

    expect(edits).to.deep.equal([]);
  });
});
