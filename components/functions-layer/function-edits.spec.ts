import { expect } from '@open-wc/testing';
import type { EditV2 } from '@openscd/oscd-api';
import {
  buildUpdateFunctionEdits,
  getInsertReference,
} from './function-edits.js';
import { eTr6100Ns } from '../../util.js';
import { docWithLinkedFunctionLNode } from '../../testfiles.js';

const docWithTwoSourcesOneSink = `<?xml version="1.0" encoding="UTF-8"?>
  <SCL xmlns="http://www.iec.ch/61850/2003/SCL"
    xmlns:eIEC61850-6-100="http://www.iec.ch/61850/2019/SCL/6-100" version="2007" revision="B">
    <Substation name="S1">
      <VoltageLevel name="V1">
        <Bay name="B1">
          <Function name="Source">
            <LNode lnClass="TCTR" lnInst="1" lnType="ABC_TYPE" />
            <LNode lnClass="TCTR" lnInst="2" lnType="ABC_TYPE" />
          </Function>
          <Function name="Sink">
            <LNode lnClass="CSWI" lnInst="1">
              <Private type="eIEC61850-6-100">
                <eIEC61850-6-100:LNodeInputs>
                  <eIEC61850-6-100:SourceRef source="S1/V1/B1/Source/TCTR1.Amp.instMag.f" service="GOOSE" />
                  <eIEC61850-6-100:SourceRef source="S1/V1/B1/Source/TCTR2.Amp.instMag.f" service="GOOSE" />
                </eIEC61850-6-100:LNodeInputs>
              </Private>
            </LNode>
          </Function>
        </Bay>
      </VoltageLevel>
    </Substation>
  </SCL>`;

function removedNodes(edits: EditV2[]): Node[] {
  return edits
    .filter(edit => 'node' in edit && !('parent' in edit))
    .map(edit => (edit as { node: Node }).node);
}

function attributeEditTargets(edits: EditV2[]): Element[] {
  return edits
    .filter(edit => 'element' in edit)
    .map(edit => (edit as { element: Element }).element);
}

describe('buildUpdateFunctionEdits', () => {
  let doc: XMLDocument;
  let source: Element;
  let tctr1: Element;
  let tctr2: Element;
  let sourceRefs: Element[];
  let sinkPrivate: Element;

  beforeEach(() => {
    doc = new DOMParser().parseFromString(
      docWithTwoSourcesOneSink,
      'application/xml'
    );
    source = doc.querySelector('Function[name="Source"]')!;
    [tctr1, tctr2] = Array.from(source.querySelectorAll('LNode'));
    sourceRefs = Array.from(doc.getElementsByTagNameNS(eTr6100Ns, 'SourceRef'));
    sinkPrivate = doc.querySelector('Function[name="Sink"] Private')!;
  });

  it('removes the whole Private when every SourceRef in it loses its source', () => {
    const { edits } = buildUpdateFunctionEdits(doc, {
      name: 'Source',
      description: null,
      type: null,
      subFunctions: [],
      lnodes: [],
      functionElement: source,
    });

    const removed = removedNodes(edits);
    expect(removed).to.include(sinkPrivate);
    expect(removed).to.include(tctr1);
    expect(removed).to.include(tctr2);
    sourceRefs.forEach(sourceRef => expect(removed).not.to.include(sourceRef));
  });

  it('does not rewrite SourceRefs that are removed in the same update', () => {
    const [refToTctr1, refToTctr2] = sourceRefs;
    const { edits } = buildUpdateFunctionEdits(doc, {
      name: 'Renamed',
      description: null,
      type: null,
      subFunctions: [],
      lnodes: [tctr2],
      functionElement: source,
    });

    expect(removedNodes(edits)).to.include(refToTctr1);
    const targets = attributeEditTargets(edits);
    expect(targets).not.to.include(refToTctr1);
    expect(targets).to.include(refToTctr2);
    const renameEdit = edits.find(
      edit => (edit as { element?: Element }).element === refToTctr2
    ) as { attributes: Record<string, string> };
    expect(renameEdit.attributes.source).to.equal(
      'S1/V1/B1/Renamed/TCTR2.Amp.instMag.f'
    );
  });

  function parse(xml: string): XMLDocument {
    return new DOMParser().parseFromString(xml, 'application/xml');
  }

  function sinkWithSource(sourcePath: string): string {
    return `<Function name="Sink">
      <LNode lnClass="CSWI" lnInst="9">
        <Private type="eIEC61850-6-100">
          <eIEC61850-6-100:LNodeInputs>
            <eIEC61850-6-100:SourceRef source="${sourcePath}" service="GOOSE" />
          </eIEC61850-6-100:LNodeInputs>
        </Private>
      </LNode>
    </Function>`;
  }

  const sclOpen = `<SCL xmlns="http://www.iec.ch/61850/2003/SCL"
    xmlns:eIEC61850-6-100="http://www.iec.ch/61850/2019/SCL/6-100" version="2007" revision="B">`;

  it('renames, deletes and adds EqSubFunctions of an EqFunction', () => {
    const eqDoc = parse(`${sclOpen}
      <Substation name="S1"><VoltageLevel name="V1"><Bay name="B1">
        <ConductingEquipment name="QA1" type="CBR">
          <EqFunction name="EF1">
            <EqSubFunction name="ESF1"><LNode lnClass="XCBR" lnInst="1" /></EqSubFunction>
            <EqSubFunction name="ESF2"><LNode lnClass="XSWI" lnInst="1" /></EqSubFunction>
          </EqFunction>
        </ConductingEquipment>
        ${sinkWithSource('S1/V1/B1/QA1/EF1/ESF1/XCBR1.Pos.stVal')}
      </Bay></VoltageLevel></Substation>
      <DataTypeTemplates><LNodeType id="CSWI_T" lnClass="CSWI" /></DataTypeTemplates>
    </SCL>`);
    const eqFunction = eqDoc.querySelector('EqFunction')!;
    const [esf1, esf2] = Array.from(
      eqFunction.querySelectorAll('EqSubFunction')
    );
    const lNodeType = eqDoc.querySelector('LNodeType')!;
    const sourceRef = eqDoc.getElementsByTagNameNS(eTr6100Ns, 'SourceRef')[0];

    const { edits, newLNodeTypes } = buildUpdateFunctionEdits(eqDoc, {
      name: 'EF2',
      description: null,
      type: null,
      subFunctions: [
        {
          id: '1',
          name: 'ESF1b',
          description: null,
          type: null,
          lnodes: Array.from(esf1.children),
          element: esf1,
        },
        {
          id: '3',
          name: 'ESF3',
          description: null,
          type: null,
          lnodes: [lNodeType],
        },
      ],
      lnodes: [],
      functionElement: eqFunction,
    });

    expect(removedNodes(edits)).to.include(esf2);
    const inserted = edits.find(
      edit => 'parent' in edit && edit.parent === eqFunction
    ) as { node: Element };
    expect(inserted.node.tagName).to.equal('EqSubFunction');
    expect(inserted.node.getAttribute('name')).to.equal('ESF3');
    expect(newLNodeTypes).to.deep.equal([lNodeType]);
    const sourceEdit = edits.find(
      edit => (edit as { element?: Element }).element === sourceRef
    ) as { attributes: Record<string, string> };
    expect(sourceEdit.attributes.source).to.equal(
      'S1/V1/B1/QA1/EF2/ESF1b/XCBR1.Pos.stVal'
    );
  });

  it('rewrites SourceRefs when renaming a Function directly under a Substation', () => {
    const subDoc = parse(`${sclOpen}
      <Substation name="S1">
        <Function name="F1"><LNode lnClass="XCBR" lnInst="1" /></Function>
        ${sinkWithSource('S1/F1/XCBR1.Pos.stVal')}
      </Substation>
    </SCL>`);
    const functionElement = subDoc.querySelector('Function[name="F1"]')!;
    const sourceRef = subDoc.getElementsByTagNameNS(eTr6100Ns, 'SourceRef')[0];

    const { edits } = buildUpdateFunctionEdits(subDoc, {
      name: 'F2',
      description: null,
      type: null,
      subFunctions: [],
      lnodes: Array.from(functionElement.children),
      functionElement,
    });

    const sourceEdit = edits.find(
      edit => (edit as { element?: Element }).element === sourceRef
    ) as { attributes: Record<string, string> };
    expect(sourceEdit.attributes.source).to.equal('S1/F2/XCBR1.Pos.stVal');
  });

  describe('with nested SubFunctions', () => {
    const nestedXml = `${sclOpen}
      <Substation name="S1"><VoltageLevel name="V1"><Bay name="B1">
        <Function name="F1">
          <SubFunction name="SF1">
            <SubFunction name="Inner"><LNode lnClass="XCBR" lnInst="1" /></SubFunction>
          </SubFunction>
        </Function>
        ${sinkWithSource('S1/V1/B1/F1/SF1/Inner/XCBR1.Pos.stVal')}
      </Bay></VoltageLevel></Substation>
    </SCL>`;

    it('keeps the nested part of the path when renaming the outer SubFunction', () => {
      const nestedDoc = parse(nestedXml);
      const functionElement = nestedDoc.querySelector('Function[name="F1"]')!;
      const sf1 = nestedDoc.querySelector('SubFunction[name="SF1"]')!;
      const sourceRef = nestedDoc.getElementsByTagNameNS(
        eTr6100Ns,
        'SourceRef'
      )[0];

      const { edits } = buildUpdateFunctionEdits(nestedDoc, {
        name: 'F2',
        description: null,
        type: null,
        subFunctions: [
          {
            id: '1',
            name: 'SF2',
            description: null,
            type: null,
            lnodes: [],
            element: sf1,
          },
        ],
        lnodes: [],
        functionElement,
      });

      expect(removedNodes(edits)).not.to.include(
        nestedDoc.querySelector('SubFunction[name="Inner"]')!
      );
      const sourceEdit = edits.find(
        edit => (edit as { element?: Element }).element === sourceRef
      ) as { attributes: Record<string, string> };
      expect(sourceEdit.attributes.source).to.equal(
        'S1/V1/B1/F2/SF2/Inner/XCBR1.Pos.stVal'
      );
    });

    it('removes links to LNodes in nested SubFunctions when the outer one is deleted', () => {
      const nestedDoc = parse(nestedXml);
      const functionElement = nestedDoc.querySelector('Function[name="F1"]')!;
      const sinkPrivateElement = nestedDoc.querySelector(
        'Function[name="Sink"] Private'
      )!;

      const { edits } = buildUpdateFunctionEdits(nestedDoc, {
        name: 'F1',
        description: null,
        type: null,
        subFunctions: [],
        lnodes: [],
        functionElement,
      });

      expect(removedNodes(edits)).to.include(sinkPrivateElement);
    });
  });
});

describe('getInsertReference', () => {
  it('excludes a removed sibling from the computed reference and restores it', () => {
    const doc = new DOMParser().parseFromString(
      docWithLinkedFunctionLNode,
      'application/xml'
    );
    const functionElement = doc.querySelector('Function[name="Source"]')!;
    const abcLNode = functionElement.querySelector('LNode')!;

    const reference = getInsertReference(functionElement, 'LNode', [abcLNode]);

    expect(reference).to.not.equal(abcLNode);
    expect(Array.from(functionElement.children)).to.include(abcLNode);
  });

  it('ignores excluded nodes that are not children of the parent', () => {
    const doc = new DOMParser().parseFromString(
      docWithLinkedFunctionLNode,
      'application/xml'
    );
    const functionElement = doc.querySelector('Function[name="Source"]')!;
    const abcLNode = functionElement.querySelector('LNode')!;
    const otherFunctionLNode = doc.querySelector(
      'Function[name="Sink"] > LNode'
    )!;

    const reference = getInsertReference(functionElement, 'LNode', [
      otherFunctionLNode,
    ]);

    expect(reference).to.equal(abcLNode);
    expect(otherFunctionLNode.parentElement).to.equal(
      doc.querySelector('Function[name="Sink"]')
    );
  });

  it('returns the existing LNode sibling when nothing is being removed', () => {
    const doc = new DOMParser().parseFromString(
      docWithLinkedFunctionLNode,
      'application/xml'
    );
    const functionElement = doc.querySelector('Function[name="Source"]')!;
    const abcLNode = functionElement.querySelector('LNode')!;

    const reference = getInsertReference(functionElement, 'LNode', []);

    expect(reference).to.equal(abcLNode);
  });
});
