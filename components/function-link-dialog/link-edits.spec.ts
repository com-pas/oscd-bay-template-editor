import { expect } from '@open-wc/testing';
import type { EditV2 } from '@openscd/oscd-api';
import {
  buildFunctionLinkEdits,
  buildRemoveSourceRefEdits,
} from './link-edits.js';
import { eTr6100Ns, eTr6100PrivType } from '../../util.js';
import {
  docWithSinkFunction,
  docWithFunctionLink,
  docWithMultipleSourceRefs,
} from '../../testfiles.js';

function isCreateEdit(edit: EditV2): edit is EditV2 & { node: Node } {
  return 'node' in edit;
}

describe('link-edits helpers', () => {
  it('creates Private, LNodeInputs and SourceRef edits for a new link', () => {
    const doc = new DOMParser().parseFromString(
      docWithSinkFunction,
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
      docWithFunctionLink,
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

  it('assigns unique inputInst values for colliding input names created in the same call', () => {
    const doc = new DOMParser().parseFromString(
      docWithSinkFunction,
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
          fullSource: 'S1/V1/B1/Source1/TCTR1.Amp.instMag.f',
        },
        {
          id: 'ref-2',
          groupKey: 'function|TCTR1',
          groupLabel: 'TCTR1 function level',
          lnodeName: 'TCTR1',
          lnClass: 'TCTR',
          lnInst: '1',
          doName: 'Amp',
          daPath: 'instMag.f',
          shortPath: 'Amp.instMag.f',
          fullSource: 'S1/V1/B1/Source2/TCTR1.Amp.instMag.f',
        },
      ],
    });

    const sourceRefElements = edits
      .filter(isCreateEdit)
      .map(edit => edit.node as Element)
      .filter(node => node.localName === 'SourceRef');

    expect(sourceRefElements.length).to.equal(2);
    expect(sourceRefElements[0].getAttribute('input')).to.equal(
      'TCTR1.Amp.instMag.f'
    );
    expect(sourceRefElements[0].getAttribute('inputInst')).to.equal(null);
    expect(sourceRefElements[1].getAttribute('input')).to.equal(
      'TCTR1.Amp.instMag.f'
    );
    expect(sourceRefElements[1].getAttribute('inputInst')).to.equal('1');
  });
});

describe('buildRemoveSourceRefEdits', () => {
  it('removes only the targeted SourceRef when siblings remain', () => {
    const doc = new DOMParser().parseFromString(
      docWithMultipleSourceRefs,
      'application/xml'
    );
    const sourceRefs = Array.from(
      doc.querySelector('LNodeInputs')!.children
    ).filter(child => child.localName === 'SourceRef');

    const edits = buildRemoveSourceRefEdits([sourceRefs[0]]);

    expect(edits.length).to.equal(1);
    expect((edits[0] as { node: Node }).node).to.equal(sourceRefs[0]);
  });

  it('removes the Private element when every SourceRef and the LNodeInputs would become empty', () => {
    const doc = new DOMParser().parseFromString(
      docWithMultipleSourceRefs,
      'application/xml'
    );
    const sourceRefs = Array.from(
      doc.querySelector('LNodeInputs')!.children
    ).filter(child => child.localName === 'SourceRef');
    const privateElement = doc.querySelector(
      'Private[type="eIEC61850-6-100"]'
    )!;

    const edits = buildRemoveSourceRefEdits(sourceRefs);

    expect(edits.length).to.equal(1);
    expect((edits[0] as { node: Node }).node).to.equal(privateElement);
  });

  it('removes only the LNodeInputs element when the Private has other children', () => {
    const doc = new DOMParser().parseFromString(
      docWithMultipleSourceRefs,
      'application/xml'
    );
    const lNodeInputsElement = doc.querySelector(
      'Function[name="Sink2"] > LNode > Private[type="eIEC61850-6-100"] > LNodeInputs'
    )!;
    const sourceRefs = Array.from(lNodeInputsElement.children).filter(
      child => child.localName === 'SourceRef'
    );

    const edits = buildRemoveSourceRefEdits(sourceRefs);

    expect(edits.length).to.equal(1);
    expect((edits[0] as { node: Node }).node).to.equal(lNodeInputsElement);
  });
});
