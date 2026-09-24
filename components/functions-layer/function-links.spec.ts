/* eslint-disable no-unused-expressions */
import { expect } from '@open-wc/testing';
import {
  findSourceRefsPointingToLNode,
  findSourceRefsPointingToLNodes,
  lNodeHasLinks,
} from './function-links.js';
import {
  docWithSinkFunction,
  docWithFunctionLink,
  docWithMultipleSourceRefs,
  docWithSourceRef,
  docWithSubFunctionSourceLink,
} from '../../testfiles.js';

describe('findSourceRefsPointingToLNode', () => {
  it('finds the SourceRef pointing at a function-level source LNode', () => {
    const doc = new DOMParser().parseFromString(
      docWithSourceRef,
      'application/xml'
    );
    const sourceLNode = doc.querySelector('Function[name="Source"] > LNode')!;
    const sourceRef = doc.querySelector('SourceRef')!;

    const found = findSourceRefsPointingToLNode(sourceLNode);

    expect(found).to.deep.equal([sourceRef]);
  });

  it('finds the SourceRef pointing at a SubFunction-level source LNode', () => {
    const doc = new DOMParser().parseFromString(
      docWithSubFunctionSourceLink,
      'application/xml'
    );
    const sourceLNode = doc.querySelector('SubFunction[name="sf1"] > LNode')!;
    const sourceRef = doc.querySelector('SourceRef')!;

    const found = findSourceRefsPointingToLNode(sourceLNode);

    expect(found).to.deep.equal([sourceRef]);
  });

  it('returns an empty array for an LNode that is not used as a source', () => {
    const doc = new DOMParser().parseFromString(
      docWithSinkFunction,
      'application/xml'
    );
    const lnode = doc.querySelector('Function[name="Sink"] > LNode')!;

    expect(findSourceRefsPointingToLNode(lnode)).to.deep.equal([]);
  });

  it('finds every SourceRef across multiple sinks referencing the same source', () => {
    const doc = new DOMParser().parseFromString(
      docWithMultipleSourceRefs,
      'application/xml'
    );
    const sourceLNode = doc.querySelector('Function[name="Source"] > LNode')!;

    const found = findSourceRefsPointingToLNode(sourceLNode);

    expect(found.length).to.equal(4);
  });
});

describe('findSourceRefsPointingToLNodes', () => {
  const doc = new DOMParser().parseFromString(
    `<SCL xmlns="http://www.iec.ch/61850/2003/SCL"
      xmlns:eIEC61850-6-100="http://www.iec.ch/61850/2019/SCL/6-100" version="2007" revision="B">
      <Substation name="S1"><VoltageLevel name="V1"><Bay name="B1">
        <Function name="Source">
          <LNode lnClass="XCBR" lnInst="1" />
          <LNode lnClass="XCBR" lnInst="10" />
          <LNode lnClass="TCTR" lnInst="1" />
        </Function>
        <Function name="Sink">
          <LNode lnClass="CSWI" lnInst="1">
            <Private type="eIEC61850-6-100">
              <eIEC61850-6-100:LNodeInputs>
                <eIEC61850-6-100:SourceRef source="S1/V1/B1/Source/XCBR1.Pos.stVal" />
                <eIEC61850-6-100:SourceRef source="S1/V1/B1/Source/XCBR10.Pos.stVal" />
                <eIEC61850-6-100:SourceRef source="S1/V1/B1/Source/TCTR1.Amp.instMag.f" />
              </eIEC61850-6-100:LNodeInputs>
            </Private>
          </LNode>
        </Function>
      </Bay></VoltageLevel></Substation>
    </SCL>`,
    'application/xml'
  );
  const [xcbr1, , tctr1] = Array.from(
    doc.querySelectorAll('Function[name="Source"] > LNode')
  );
  const sourceOf = (sourceRef: Element) => sourceRef.getAttribute('source');

  it('finds the SourceRefs of several LNodes in one call', () => {
    expect(
      findSourceRefsPointingToLNodes([xcbr1, tctr1]).map(sourceOf)
    ).to.deep.equal([
      'S1/V1/B1/Source/XCBR1.Pos.stVal',
      'S1/V1/B1/Source/TCTR1.Amp.instMag.f',
    ]);
  });

  it('does not match an LNode whose name is a prefix of another', () => {
    expect(findSourceRefsPointingToLNodes([xcbr1]).map(sourceOf)).to.deep.equal(
      ['S1/V1/B1/Source/XCBR1.Pos.stVal']
    );
  });

  it('searches the LNodes document even when an LNodeType from elsewhere comes first', () => {
    const library = new DOMParser().parseFromString(
      '<SCL><DataTypeTemplates><LNodeType id="T" lnClass="XCBR" /></DataTypeTemplates></SCL>',
      'application/xml'
    );
    const lNodeType = library.querySelector('LNodeType')!;

    expect(findSourceRefsPointingToLNodes([lNodeType, tctr1]).length).to.equal(
      1
    );
  });
});

describe('lNodeHasLinks', () => {
  it('is true for a sink LNode with its own LNodeInputs', () => {
    const doc = new DOMParser().parseFromString(
      docWithFunctionLink,
      'application/xml'
    );
    const sinkLNode = doc.querySelector('Function[name="Sink"] > LNode')!;

    expect(lNodeHasLinks(sinkLNode)).to.be.true;
  });

  it('is true for a source LNode referenced elsewhere', () => {
    const doc = new DOMParser().parseFromString(
      docWithSourceRef,
      'application/xml'
    );
    const sourceLNode = doc.querySelector('Function[name="Source"] > LNode')!;

    expect(lNodeHasLinks(sourceLNode)).to.be.true;
  });

  it('is false for an LNode unrelated to any link', () => {
    const doc = new DOMParser().parseFromString(
      docWithSinkFunction,
      'application/xml'
    );
    const lnode = doc.querySelector('Function[name="Sink"] > LNode')!;

    expect(lNodeHasLinks(lnode)).to.be.false;
  });
});
