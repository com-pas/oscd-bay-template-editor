/* eslint-disable no-unused-expressions */
import { expect } from '@open-wc/testing';
import { buildInputEdits, getBayProcessResources } from './input-edits.js';
import { buildFunctionLinkEdits } from '../function-link-dialog/link-edits.js';
import { eTr6100Ns, eTr6100PrivType } from '../../util.js';
import { docForInputEdits } from '../../testfiles.js';

const sclNs = 'http://www.iec.ch/61850/2003/SCL';

describe('input edits', () => {
  let doc: XMLDocument;
  let sinkLNode: Element;
  let inputEditParams: Parameters<typeof buildInputEdits>[0];

  beforeEach(() => {
    doc = new DOMParser().parseFromString(docForInputEdits, 'application/xml');
    sinkLNode = doc.querySelector('Bay[name="B1"] Function > LNode')!;

    inputEditParams = {
      doc,
      sinkLNode,
      resourceName: 'OvercurrentPhaseCT',
      description: 'Phase CT feeding the overcurrent protection',
      sourceClass: 'TCTR',
      dataObject: 'AmpSv',
      dataAttribute: 'instMag',
      inputName: 'AmpSv',
    };
  });

  function extensionElements(name: string) {
    return Array.from(doc.getElementsByTagNameNS(eTr6100Ns, name));
  }

  function attributes(element: Element) {
    return Object.fromEntries(
      Array.from(element.attributes).map(attr => [attr.name, attr.value])
    );
  }

  it('builds the example exactly without modifying the document before edits are applied', () => {
    const before = new XMLSerializer().serializeToString(doc);
    const edits = buildInputEdits(inputEditParams);
    expect(new XMLSerializer().serializeToString(doc)).to.equal(before);
    for (const edit of edits) {
      if ('parent' in edit) {
        edit.parent.insertBefore(edit.node, edit.reference);
      } else if ('element' in edit && 'attributesNS' in edit) {
        Object.entries(edit.attributesNS ?? {}).forEach(([ns, attrs]) =>
          Object.entries(attrs ?? {}).forEach(([name, value]) => {
            if (value !== null && value !== undefined)
              edit.element.setAttributeNS(ns, name, value);
          })
        );
      } else {
        throw new Error('Unexpected edit in Add Input');
      }
    }

    const [container] = extensionElements('ProcessResources');
    expect(container.parentElement?.localName).to.equal('Private');
    expect(container.parentElement?.namespaceURI).to.equal(sclNs);
    expect(container.parentElement?.getAttribute('type')).to.equal(
      eTr6100PrivType
    );
    expect(container.parentElement?.parentElement).to.equal(
      sinkLNode.closest('Bay')
    );
    expect(container.children.length).to.equal(1);
    const [resource] = extensionElements('ProcessResource');
    expect(attributes(resource)).to.deep.equal({
      name: 'OvercurrentPhaseCT',
      desc: 'Phase CT feeding the overcurrent protection',
      selector: "ancestor::VoltageLevel//LNode[@lnClass='TCTR']",
      cardinality: '1..1',
    });
    expect(resource.children.length).to.equal(0);
    const [sourceRef] = extensionElements('SourceRef');
    expect(attributes(sourceRef)).to.deep.equal({
      input: 'AmpSv',
      resourceName: 'OvercurrentPhaseCT',
      pLN: 'TCTR',
      pDO: 'AmpSv',
      pDA: 'instMag',
    });
    expect(sourceRef.parentElement?.localName).to.equal('LNodeInputs');
    expect(
      sourceRef.parentElement?.parentElement?.getAttribute('type')
    ).to.equal(eTr6100PrivType);
    expect(sourceRef.parentElement?.parentElement?.parentElement).to.equal(
      sinkLNode
    );
    const serialized = new XMLSerializer().serializeToString(doc);
    const reparsed = new DOMParser().parseFromString(
      serialized,
      'application/xml'
    );
    expect(reparsed.querySelector('parsererror')).to.be.null;
    expect(
      reparsed.getElementsByTagNameNS(eTr6100Ns, 'SourceRef').length
    ).to.equal(1);
  });

  it('reuses the same bay container and LNodeInputs for a second input', () => {
    for (const edit of buildInputEdits(inputEditParams)) {
      if ('parent' in edit) edit.parent.insertBefore(edit.node, edit.reference);
      else if ('element' in edit && 'attributesNS' in edit)
        Object.entries(edit.attributesNS ?? {}).forEach(([ns, attrs]) =>
          Object.entries(attrs ?? {}).forEach(([name, value]) => {
            if (value !== null && value !== undefined)
              edit.element.setAttributeNS(ns, name, value);
          })
        );
      else throw new Error('Unexpected edit in Add Input');
    }
    const [container] = extensionElements('ProcessResources');
    const [inputs] = extensionElements('LNodeInputs');
    const before = new XMLSerializer().serializeToString(doc);
    const edits = buildInputEdits({
      ...inputEditParams,
      resourceName: 'SecondResource',
    });
    expect(new XMLSerializer().serializeToString(doc)).to.equal(before);
    expect(edits.length).to.equal(2);
    for (const edit of edits) {
      if ('parent' in edit) edit.parent.insertBefore(edit.node, edit.reference);
      else if ('element' in edit && 'attributesNS' in edit)
        Object.entries(edit.attributesNS ?? {}).forEach(([ns, attrs]) =>
          Object.entries(attrs ?? {}).forEach(([name, value]) => {
            if (value !== null && value !== undefined)
              edit.element.setAttributeNS(ns, name, value);
          })
        );
      else throw new Error('Unexpected edit in Add Input');
    }
    expect(extensionElements('ProcessResources')).to.deep.equal([container]);
    expect(extensionElements('LNodeInputs')).to.deep.equal([inputs]);
    expect(container.children.length).to.equal(2);
    expect(inputs.children.length).to.equal(2);
  });

  it('shares a bay container with a SubFunction sink but creates separate containers in other bays', () => {
    for (const edit of buildInputEdits(inputEditParams)) {
      if ('parent' in edit) edit.parent.insertBefore(edit.node, edit.reference);
      else if ('element' in edit && 'attributesNS' in edit)
        Object.entries(edit.attributesNS ?? {}).forEach(([ns, attrs]) =>
          Object.entries(attrs ?? {}).forEach(([name, value]) => {
            if (value !== null && value !== undefined)
              edit.element.setAttributeNS(ns, name, value);
          })
        );
      else throw new Error('Unexpected edit in Add Input');
    }
    const subSink = doc.querySelector('SubFunction > LNode')!;
    for (const edit of buildInputEdits({
      ...inputEditParams,
      sinkLNode: subSink,
      resourceName: 'SubResource',
    })) {
      if ('parent' in edit) edit.parent.insertBefore(edit.node, edit.reference);
      else if ('element' in edit && 'attributesNS' in edit)
        Object.entries(edit.attributesNS ?? {}).forEach(([ns, attrs]) =>
          Object.entries(attrs ?? {}).forEach(([name, value]) => {
            if (value !== null && value !== undefined)
              edit.element.setAttributeNS(ns, name, value);
          })
        );
      else throw new Error('Unexpected edit in Add Input');
    }
    expect(extensionElements('ProcessResources').length).to.equal(1);
    expect(
      subSink.getElementsByTagNameNS(eTr6100Ns, 'SourceRef').length
    ).to.equal(1);
    for (const edit of buildInputEdits({
      ...inputEditParams,
      sinkLNode: doc.querySelector('Bay[name="B2"] LNode')!,
    })) {
      if ('parent' in edit) edit.parent.insertBefore(edit.node, edit.reference);
      else if ('element' in edit && 'attributesNS' in edit)
        Object.entries(edit.attributesNS ?? {}).forEach(([ns, attrs]) =>
          Object.entries(attrs ?? {}).forEach(([name, value]) => {
            if (value !== null && value !== undefined)
              edit.element.setAttributeNS(ns, name, value);
          })
        );
      else throw new Error('Unexpected edit in Add Input');
    }
    expect(extensionElements('ProcessResources').length).to.equal(2);
    extensionElements('ProcessResources').forEach(container => {
      expect(container.parentElement?.parentElement?.localName).to.equal('Bay');
    });
  });

  it('reuses extension Private elements without disturbing unrelated content', () => {
    [sinkLNode.closest('Bay')!, sinkLNode].forEach(parent => {
      const priv = doc.createElementNS(sclNs, 'Private');
      priv.setAttribute('type', eTr6100PrivType);
      priv.append(doc.createElementNS(eTr6100Ns, 'ext:Other'));
      parent.prepend(priv);
    });
    const privates = Array.from(doc.querySelectorAll('Private'));
    for (const edit of buildInputEdits(inputEditParams)) {
      if ('parent' in edit) edit.parent.insertBefore(edit.node, edit.reference);
      else if ('element' in edit && 'attributesNS' in edit)
        Object.entries(edit.attributesNS ?? {}).forEach(([ns, attrs]) =>
          Object.entries(attrs ?? {}).forEach(([name, value]) => {
            if (value !== null && value !== undefined)
              edit.element.setAttributeNS(ns, name, value);
          })
        );
      else throw new Error('Unexpected edit in Add Input');
    }
    expect(Array.from(doc.querySelectorAll('Private'))).to.deep.equal(privates);
    expect(extensionElements('Other').length).to.equal(2);
    expect(extensionElements('SourceRef').length).to.equal(1);
  });

  it('appends an unbound input without changing an existing intra-bay SourceRef', () => {
    const priv = doc.createElementNS(sclNs, 'Private');
    priv.setAttribute('type', eTr6100PrivType);
    const inputs = doc.createElementNS(eTr6100Ns, 'ext:LNodeInputs');
    const boundRef = doc.createElementNS(eTr6100Ns, 'ext:SourceRef');
    Object.entries({
      source: 'S1/V1/B1/Source/TCTR1.Amp.instMag.f',
      input: 'TCTR1.Amp.instMag.f',
      inputInst: '1',
      pLN: 'TCTR',
      pDO: 'Amp',
      pDA: 'instMag.f',
      service: 'SMV',
    }).forEach(([name, value]) => boundRef.setAttribute(name, value));
    inputs.append(boundRef);
    priv.append(inputs);
    sinkLNode.append(priv);
    const before = new XMLSerializer().serializeToString(boundRef);
    for (const edit of buildInputEdits(inputEditParams)) {
      if ('parent' in edit) edit.parent.insertBefore(edit.node, edit.reference);
      else if ('element' in edit && 'attributesNS' in edit)
        Object.entries(edit.attributesNS ?? {}).forEach(([ns, attrs]) =>
          Object.entries(attrs ?? {}).forEach(([name, value]) => {
            if (value !== null && value !== undefined)
              edit.element.setAttributeNS(ns, name, value);
          })
        );
      else throw new Error('Unexpected edit in Add Input');
    }
    expect(extensionElements('LNodeInputs')).to.deep.equal([inputs]);
    expect(inputs.firstElementChild).to.equal(boundRef);
    expect(inputs.children.length).to.equal(2);
    expect(new XMLSerializer().serializeToString(boundRef)).to.equal(before);
    expect(inputs.lastElementChild?.getAttribute('resourceName')).to.equal(
      'OvercurrentPhaseCT'
    );
    expect(inputs.lastElementChild?.hasAttribute('source')).to.be.false;
  });

  it('preserves resource names and omits optional attributes when empty', () => {
    for (const edit of buildInputEdits({
      ...inputEditParams,
      resourceName: ' CT & phase ',
      description: '',
      dataAttribute: '',
    })) {
      if ('parent' in edit) edit.parent.insertBefore(edit.node, edit.reference);
      else if ('element' in edit && 'attributesNS' in edit)
        Object.entries(edit.attributesNS ?? {}).forEach(([ns, attrs]) =>
          Object.entries(attrs ?? {}).forEach(([name, value]) => {
            if (value !== null && value !== undefined)
              edit.element.setAttributeNS(ns, name, value);
          })
        );
      else throw new Error('Unexpected edit in Add Input');
    }
    const [resource] = extensionElements('ProcessResource');
    const [sourceRef] = extensionElements('SourceRef');
    expect(resource.getAttribute('name')).to.equal(' CT & phase ');
    expect(sourceRef.getAttribute('resourceName')).to.equal(
      resource.getAttribute('name')
    );
    expect(resource.hasAttribute('desc')).to.be.false;
    expect(sourceRef.hasAttribute('pDA')).to.be.false;
    expect(sourceRef.hasAttribute('source')).to.be.false;
    expect(sourceRef.hasAttribute('service')).to.be.false;
    expect(resource.hasAttribute('max')).to.be.false;
  });

  it('creates identical intra-bay links with and without an existing unbound input', () => {
    const baselineDoc = doc.cloneNode(true) as XMLDocument;
    const baselineSink = baselineDoc.querySelector('LNode')!;
    const link = (target: Element) =>
      buildFunctionLinkEdits({
        doc: target.ownerDocument,
        sinkLNode: target,
        namespacePrefix: 'ext',
        service: 'GOOSE',
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
    for (const edit of link(baselineSink)) {
      if ('parent' in edit) edit.parent.insertBefore(edit.node, edit.reference);
      else if ('element' in edit && 'attributesNS' in edit)
        Object.entries(edit.attributesNS ?? {}).forEach(([ns, attrs]) =>
          Object.entries(attrs ?? {}).forEach(([name, value]) => {
            if (value !== null && value !== undefined)
              edit.element.setAttributeNS(ns, name, value);
          })
        );
      else throw new Error('Unexpected edit in Add Input');
    }

    for (const edit of buildInputEdits(inputEditParams)) {
      if ('parent' in edit) edit.parent.insertBefore(edit.node, edit.reference);
      else if ('element' in edit && 'attributesNS' in edit)
        Object.entries(edit.attributesNS ?? {}).forEach(([ns, attrs]) =>
          Object.entries(attrs ?? {}).forEach(([name, value]) => {
            if (value !== null && value !== undefined)
              edit.element.setAttributeNS(ns, name, value);
          })
        );
      else throw new Error('Unexpected edit in Add Input');
    }
    const [unbound] = extensionElements('SourceRef');
    const serializer = new XMLSerializer();
    const before = serializer.serializeToString(unbound);
    for (const edit of link(sinkLNode)) {
      if ('parent' in edit) edit.parent.insertBefore(edit.node, edit.reference);
      else if ('element' in edit && 'attributesNS' in edit)
        Object.entries(edit.attributesNS ?? {}).forEach(([ns, attrs]) =>
          Object.entries(attrs ?? {}).forEach(([name, value]) => {
            if (value !== null && value !== undefined)
              edit.element.setAttributeNS(ns, name, value);
          })
        );
      else throw new Error('Unexpected edit in Add Input');
    }

    const refs = extensionElements('SourceRef');
    expect(refs.length).to.equal(2);
    expect(serializer.serializeToString(unbound)).to.equal(before);
    expect(serializer.serializeToString(refs[1])).to.equal(
      serializer.serializeToString(
        baselineSink.getElementsByTagNameNS(eTr6100Ns, 'SourceRef')[0]
      )
    );
    expect(attributes(refs[1])).to.deep.equal({
      source: 'S1/V1/B1/Source/TCTR1.Amp.instMag.f',
      input: 'TCTR1.Amp.instMag.f',
      inputInst: '1',
      pLN: 'TCTR',
      pDO: 'Amp',
      pDA: 'instMag.f',
      service: 'GOOSE',
    });
  });

  it('uses the existing namespace prefix, or chooses a free prefix without overwriting another namespace', () => {
    const xmlns = 'http://www.w3.org/2000/xmlns/';
    doc.documentElement.setAttributeNS(xmlns, 'xmlns:custom', eTr6100Ns);
    const edits = buildInputEdits(inputEditParams);
    expect(edits.every(edit => 'parent' in edit)).to.be.true;
    for (const edit of edits) {
      if ('parent' in edit) edit.parent.insertBefore(edit.node, edit.reference);
      else if ('element' in edit && 'attributesNS' in edit)
        Object.entries(edit.attributesNS ?? {}).forEach(([ns, attrs]) =>
          Object.entries(attrs ?? {}).forEach(([name, value]) => {
            if (value !== null && value !== undefined)
              edit.element.setAttributeNS(ns, name, value);
          })
        );
      else throw new Error('Unexpected edit in Add Input');
    }
    expect(extensionElements('ProcessResource')[0].prefix).to.equal('custom');

    doc.documentElement.removeAttributeNS(xmlns, 'custom');
    doc.documentElement.setAttributeNS(
      xmlns,
      `xmlns:${eTr6100PrivType}`,
      'urn:other'
    );
    for (const edit of buildInputEdits({
      ...inputEditParams,
      resourceName: 'SecondResource',
    })) {
      if ('parent' in edit) edit.parent.insertBefore(edit.node, edit.reference);
      else if ('element' in edit && 'attributesNS' in edit)
        Object.entries(edit.attributesNS ?? {}).forEach(([ns, attrs]) =>
          Object.entries(attrs ?? {}).forEach(([name, value]) => {
            if (value !== null && value !== undefined)
              edit.element.setAttributeNS(ns, name, value);
          })
        );
      else throw new Error('Unexpected edit in Add Input');
    }
    expect(doc.documentElement.lookupNamespaceURI(eTr6100PrivType)).to.equal(
      'urn:other'
    );
    expect(extensionElements('ProcessResource')[1].prefix).to.equal(
      `${eTr6100PrivType}_1`
    );
  });

  it('rejects duplicate names and ambiguous containers without changing existing XML', () => {
    for (const edit of buildInputEdits(inputEditParams)) {
      if ('parent' in edit) edit.parent.insertBefore(edit.node, edit.reference);
      else if ('element' in edit && 'attributesNS' in edit)
        Object.entries(edit.attributesNS ?? {}).forEach(([ns, attrs]) =>
          Object.entries(attrs ?? {}).forEach(([name, value]) => {
            if (value !== null && value !== undefined)
              edit.element.setAttributeNS(ns, name, value);
          })
        );
      else throw new Error('Unexpected edit in Add Input');
    }
    const before = new XMLSerializer().serializeToString(doc);
    expect(() => buildInputEdits(inputEditParams)).to.throw(
      'Resource name already exists in this bay.'
    );
    expect(new XMLSerializer().serializeToString(doc)).to.equal(before);
    const bay = sinkLNode.closest('Bay')!;
    const [container] = getBayProcessResources(bay);
    container.parentElement!.append(container.cloneNode(true));
    expect(() =>
      buildInputEdits({ ...inputEditParams, resourceName: 'Other' })
    ).to.throw('more than one ProcessResources');
  });

  it('rejects missing required values, invalid source classes and unavailable sinks', () => {
    expect(() =>
      buildInputEdits({ ...inputEditParams, resourceName: ' ' })
    ).to.throw('are required');
    expect(() =>
      buildInputEdits({ ...inputEditParams, dataObject: ' ' })
    ).to.throw('are required');
    expect(() =>
      buildInputEdits({ ...inputEditParams, inputName: ' ' })
    ).to.throw('are required');
    expect(() =>
      buildInputEdits({
        ...inputEditParams,
        sourceClass: "TCTR'] | //* | //*['",
      })
    ).to.throw('valid source');
    expect(() =>
      buildInputEdits({
        ...inputEditParams,
        sinkLNode: doc.querySelector('Function')!,
      })
    ).to.throw('sink LNode');
    const foreign = sinkLNode.cloneNode(true) as Element;
    expect(() =>
      buildInputEdits({ ...inputEditParams, sinkLNode: foreign })
    ).to.throw('sink LNode');
    sinkLNode.remove();
    expect(() => buildInputEdits(inputEditParams)).to.throw('sink LNode');
  });
});
