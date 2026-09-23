/* eslint-disable no-unused-expressions */
import { html } from 'lit';
import sinon, { spy } from 'sinon';
import { fixture, expect } from '@open-wc/testing';
import BayTemplatePlugin from './bay-template-editor.js';
import {
  emptyDoc,
  docWithSubstation,
  docWithVoltageLevel,
  docWithBay,
  docWithBusBarBay,
  docWithElements,
  docForFunctionLinkFlow,
  docWithAllElements,
  docWithSinkFunction,
  docWithBayAndFunctions,
  docForUpdateFunction,
  docWithLinkedFunctionLNode,
  docWithSubFunctionSourceLink,
} from './testfiles.js';
import { eqTypes, SubfunctionData } from './util.js';

if (!customElements.get('oscd-editor-bay-template')) {
  customElements.define('oscd-editor-bay-template', BayTemplatePlugin);
}

describe('Bay Template Editor Plugin', () => {
  let element: BayTemplatePlugin;

  beforeEach(async () => {
    element = await fixture(
      html`<oscd-editor-bay-template></oscd-editor-bay-template>`
    );
    await element.updateComplete;
  });

  describe('createFunction', () => {
    function setupElementWithDoc(xml: string) {
      const doc = new DOMParser().parseFromString(xml, 'application/xml');
      element.doc = doc;
      return doc;
    }

    function triggerAndCapture(
      selected: Element,
      name = 'F1',
      subfunctions: SubfunctionData[] = [],
      lnodes: Element[] = []
    ) {
      const dispatchSpy = spy(element, 'dispatchEvent');
      element.selectedElement = selected;
      element.createFunction({
        detail: {
          name,
          description: 'desc',
          type: 'type',
          subfunctions,
          lnodes,
        },
      } as any);
      const editCall = dispatchSpy.args.find(
        args => (args[0] as CustomEvent).type === 'oscd-edit-v2'
      );
      expect(editCall, 'oscd-edit-v2 event was dispatched').to.exist;
      const { edit } = (editCall![0] as CustomEvent).detail;
      const createEdit = Array.isArray(edit) ? edit[0] : edit;
      const { parent, node } = createEdit;
      dispatchSpy.restore();
      return { parent: parent as Element, fn: node as Element };
    }

    it('adds Function to Bay', async () => {
      const doc = setupElementWithDoc(docWithBay);
      const bay = doc.querySelector('Bay')!;
      const { parent, fn } = triggerAndCapture(bay, 'Fbay');
      expect(parent).to.equal(bay);
      expect(fn.tagName).to.equal('Function');
      expect(fn.getAttribute('name')).to.equal('Fbay');
      expect(fn.querySelector('Private[type="eIEC61850-6-100"]')).to.not.exist;
    });

    it('adds Function and Subfunctions to Bay', async () => {
      const doc = setupElementWithDoc(docWithBay);
      const bay = doc.querySelector('Bay')!;
      const subfunctions = [
        { name: 'Sub1', description: 'desc', type: 'type', lnodes: null },
        { name: 'Sub2', description: 'desc', type: 'type', lnodes: null },
      ];
      const { parent, fn } = triggerAndCapture(bay, 'Fbay', subfunctions);
      expect(parent).to.equal(bay);
      expect(fn.tagName).to.equal('Function');
      expect(fn.getAttribute('name')).to.equal('Fbay');
      const subFnElements = fn.querySelectorAll('SubFunction');
      expect(subFnElements.length).to.equal(2);
      expect(subFnElements[0].getAttribute('name')).to.equal('Sub1');
      expect(subFnElements[1].getAttribute('name')).to.equal('Sub2');
    });

    it('adds Function and LNodes to Bay', async () => {
      const doc = setupElementWithDoc(docWithBay);
      const bay = doc.querySelector('Bay')!;
      const lnodes = [
        doc.createElement('LNodeType'),
        doc.createElement('LNodeType'),
      ];
      lnodes[0].setAttribute('lnClass', 'LLN0');
      lnodes[0].setAttribute('desc', 'desc');
      lnodes[1].setAttribute('lnClass', 'XCBR');
      lnodes[1].setAttribute('desc', 'desc');
      const { parent, fn } = triggerAndCapture(bay, 'Fbay', [], lnodes);
      expect(parent).to.equal(bay);
      expect(fn.tagName).to.equal('Function');
      expect(fn.getAttribute('name')).to.equal('Fbay');
      const lnodeElements = fn.querySelectorAll('LNode');
      expect(lnodeElements.length).to.equal(2);
      expect(lnodeElements[0].getAttribute('lnClass')).to.equal('LLN0');
      expect(lnodeElements[1].getAttribute('lnClass')).to.equal('XCBR');
    });

    it('adds Function to VoltageLevel', async () => {
      const doc = setupElementWithDoc(docWithVoltageLevel);
      const vl = doc.querySelector('VoltageLevel')!;
      const { parent, fn } = triggerAndCapture(vl, 'Fvl');
      expect(parent).to.equal(vl);
      expect(fn.tagName).to.equal('Function');
      expect(fn.getAttribute('name')).to.equal('Fvl');
      expect(fn.querySelector('Private[type="eIEC61850-6-100"]')).to.not.exist;
    });

    it('adds Function to Substation', async () => {
      const doc = setupElementWithDoc(docWithSubstation);
      const sub = doc.querySelector('Substation')!;
      const { parent, fn } = triggerAndCapture(sub, 'Fsub');
      expect(parent).to.equal(sub);
      expect(fn.tagName).to.equal('Function');
      expect(fn.getAttribute('name')).to.equal('Fsub');
      expect(fn.querySelector('Private[type="eIEC61850-6-100"]')).to.not.exist;
    });

    it('adds EqFunction to ConductingEquipment, with EqSubFunction', async () => {
      const doc = setupElementWithDoc(docWithBay);
      const bay = doc.querySelector('Bay')!;
      const ce = doc.createElement('ConductingEquipment');
      ce.setAttribute('name', 'CE1');
      bay.appendChild(ce);
      const subfunctions = [
        { name: 'ESF1', description: 'desc', type: 'type', lnodes: null },
      ];
      const { parent, fn } = triggerAndCapture(ce, 'Fce', subfunctions);
      expect(parent).to.equal(ce);
      expect(fn.tagName).to.equal('EqFunction');
      expect(fn.getAttribute('name')).to.equal('Fce');
      const eqSubFunctions = fn.querySelectorAll(':scope > EqSubFunction');
      expect(eqSubFunctions.length).to.equal(1);
      expect(eqSubFunctions[0].getAttribute('name')).to.equal('ESF1');
    });

    it('keeps LNode elements before EqSubFunction in EqFunction', async () => {
      const doc = setupElementWithDoc(docWithBay);
      const bay = doc.querySelector('Bay')!;
      const ce = doc.createElement('ConductingEquipment');
      ce.setAttribute('name', 'CE1');
      bay.appendChild(ce);

      const subfunctions = [
        { name: 'ESF1', description: 'desc', type: 'type', lnodes: null },
      ];
      const lnodes = [doc.createElement('LNodeType')];
      lnodes[0].setAttribute('lnClass', 'XCBR');
      lnodes[0].setAttribute('desc', 'breaker');

      const { fn } = triggerAndCapture(ce, 'Fce', subfunctions, lnodes);
      const childTags = Array.from(fn.children).map(child => child.tagName);
      const lastLNodeIdx = childTags.lastIndexOf('LNode');
      const firstEqSubFnIdx = childTags.indexOf('EqSubFunction');
      expect(lastLNodeIdx).to.be.greaterThan(-1);
      expect(firstEqSubFnIdx).to.be.greaterThan(lastLNodeIdx);
    });

    it('adds EqFunction to PowerTransformer', async () => {
      const doc = setupElementWithDoc(docWithBay);
      const bay = doc.querySelector('Bay')!;
      const pt = doc.createElement('PowerTransformer');
      pt.setAttribute('name', 'PTR1');
      bay.appendChild(pt);
      const { parent, fn } = triggerAndCapture(pt, 'Fptr');
      expect(parent).to.equal(pt);
      expect(fn.getAttribute('name')).to.equal('Fptr');
    });

    it('adds EqFunction to TransformerWinding', async () => {
      const doc = setupElementWithDoc(docWithBay);
      const bay = doc.querySelector('Bay')!;
      const pt = doc.createElement('PowerTransformer');
      pt.setAttribute('name', 'PTR1');
      const tw = doc.createElement('TransformerWinding');
      tw.setAttribute('name', 'TW1');
      pt.appendChild(tw);
      bay.appendChild(pt);
      const { parent, fn } = triggerAndCapture(tw, 'Ftw');
      expect(parent).to.equal(tw);
      expect(fn.getAttribute('name')).to.equal('Ftw');
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('updateFunction', () => {
    function setupElementWithDoc(xml: string) {
      const doc = new DOMParser().parseFromString(xml, 'application/xml');
      element.doc = doc;
      return doc;
    }

    function captureEdits(callback: () => void): any[] {
      const dispatchSpy = spy(element, 'dispatchEvent');
      callback();
      const edits = dispatchSpy.args
        .map(args => args[0] as CustomEvent)
        .filter(e => e.type === 'oscd-edit-v2')
        .flatMap(e => {
          const { edit } = e.detail;
          return Array.isArray(edit) ? edit : [edit];
        });
      dispatchSpy.restore();
      return edits;
    }

    it('updates only the attributes that changed', () => {
      const doc = setupElementWithDoc(docForUpdateFunction);
      const functionElement = doc.querySelector('Function[name="F1"]')!;

      const edits = captureEdits(() => {
        element.updateFunction({
          name: 'F2',
          description: 'd2',
          type: 't1',
          subfunctions: [],
          lnodes: [],
          functionElement,
        });
      });

      expect(edits.length).to.equal(1);
      const [attrEdit] = edits as any[];
      expect(attrEdit.element).to.equal(functionElement);
      expect(attrEdit.attributes).to.deep.equal({ name: 'F2', desc: 'd2' });
    });

    it('does not dispatch an edit when nothing changed', () => {
      const doc = setupElementWithDoc(docForUpdateFunction);
      const functionElement = doc.querySelector('Function[name="F1"]')!;

      const edits = captureEdits(() => {
        element.updateFunction({
          name: 'F1',
          description: 'd1',
          type: 't1',
          subfunctions: [],
          lnodes: [],
          functionElement,
        });
      });

      expect(edits.length).to.equal(0);
    });

    it('updates SourceRef sources for the exact renamed Function path only', () => {
      const doc = setupElementWithDoc(`<?xml version="1.0" encoding="UTF-8"?>
        <SCL xmlns="http://www.iec.ch/61850/2003/SCL"
          xmlns:eIEC61850-6-100="http://www.iec.ch/61850/2019/SCL/6-100" version="2007" revision="B">
          <Substation name="S1">
            <VoltageLevel name="V1">
              <Bay name="B1">
                <Function name="Source"><LNode lnClass="LLN0" lnInst="1" /></Function>
                <Function name="Sink"><LNode lnClass="CSWI" lnInst="1"><Private type="eIEC61850-6-100"><eIEC61850-6-100:LNodeInputs><eIEC61850-6-100:SourceRef source="S1/V1/B1/Source/LLN01.Pos.stVal" /></eIEC61850-6-100:LNodeInputs></Private></LNode></Function>
              </Bay>
              <Bay name="B2">
                <Function name="Source"><LNode lnClass="LLN0" lnInst="1" /></Function>
                <Function name="Sink"><LNode lnClass="CSWI" lnInst="1"><Private type="eIEC61850-6-100"><eIEC61850-6-100:LNodeInputs><eIEC61850-6-100:SourceRef source="S1/V1/B2/Source/LLN01.Pos.stVal" /></eIEC61850-6-100:LNodeInputs></Private></LNode></Function>
              </Bay>
            </VoltageLevel>
          </Substation>
        </SCL>`);
      const functionElement = doc.querySelector(
        'Bay[name="B1"] > Function[name="Source"]'
      )!;
      const [sourceRefB1, sourceRefB2] = Array.from(
        doc.getElementsByTagNameNS(
          'http://www.iec.ch/61850/2019/SCL/6-100',
          'SourceRef'
        )
      );

      const edits = captureEdits(() => {
        element.updateFunction({
          name: 'RenamedSource',
          description: null,
          type: null,
          subfunctions: [],
          lnodes: Array.from(functionElement.children).filter(
            child => child.tagName === 'LNode'
          ),
          functionElement,
        });
      });

      const sourceRefEdits = edits.filter(
        (e: any) => e.element?.localName === 'SourceRef'
      );
      expect(sourceRefEdits.length).to.equal(1);
      expect(sourceRefEdits[0].element).to.equal(sourceRefB1);
      expect(sourceRefEdits[0].attributes).to.deep.equal({
        source: 'S1/V1/B1/RenamedSource/LLN01.Pos.stVal',
      });
      expect(sourceRefEdits.some((e: any) => e.element === sourceRefB2)).to.be
        .false;
    });

    it('updates SourceRef sources for composed Function and SubFunction renames', () => {
      const doc = setupElementWithDoc(docWithSubFunctionSourceLink);
      const functionElement = doc.querySelector('Function[name="a"]')!;
      const subFunction = functionElement.querySelector(
        'SubFunction[name="sf1"]'
      )!;
      const sourceRef = doc.querySelector('SourceRef')!;

      const edits = captureEdits(() => {
        element.updateFunction({
          name: 'b',
          description: null,
          type: null,
          subfunctions: [
            {
              name: 'sf2',
              description: null,
              type: null,
              lnodes: Array.from(subFunction.children).filter(
                child => child.tagName === 'LNode'
              ),
              element: subFunction,
            },
          ],
          lnodes: [],
          functionElement,
        });
      });

      const sourceRefEdit = edits.find(
        (e: any) => e.element === sourceRef
      ) as any;
      expect(sourceRefEdit).to.exist;
      expect(sourceRefEdit.attributes).to.deep.equal({
        source: 'S1/V1/B1/b/sf2/TCTR1.Amp.instMag.f',
      });
    });

    it('removes a linked LNode and adds a new one without a stale reference', () => {
      const doc = setupElementWithDoc(docWithLinkedFunctionLNode);
      const functionElement = doc.querySelector('Function[name="Source"]')!;
      const abcLNode = functionElement.querySelector('LNode')!;
      const defType = doc.querySelector('LNodeType[id="DEF_TYPE"]')!;

      const edits = captureEdits(() => {
        element.updateFunction({
          name: 'Source',
          description: null,
          type: null,
          subfunctions: [],
          lnodes: [defType],
          functionElement,
        });
      });

      const removeAbc = edits.find((e: any) => e.node === abcLNode);
      const insertDef = edits.find(
        (e: any) =>
          'parent' in e && e.node?.getAttribute?.('lnType') === 'DEF_TYPE'
      );
      const removesSourceRefContainer = edits.some(
        (e: any) =>
          'node' in e &&
          !('parent' in e) &&
          e.node !== abcLNode &&
          (e.node.tagName === 'Private' || e.node.localName === 'LNodeInputs')
      );

      expect(removeAbc, 'expected abc LNode to be removed').to.exist;
      expect(removesSourceRefContainer, 'expected sourceRef cleanup').to.be
        .true;
      expect(insertDef, 'expected def LNode to be inserted').to.exist;
      expect(insertDef.reference).to.not.equal(abcLNode);
    });

    it('removes all LNodes from a Function', () => {
      const doc = setupElementWithDoc(docWithLinkedFunctionLNode);
      const functionElement = doc.querySelector('Function[name="Source"]')!;
      const abcLNode = functionElement.querySelector('LNode')!;

      const edits = captureEdits(() => {
        element.updateFunction({
          name: 'Source',
          description: null,
          type: null,
          subfunctions: [],
          lnodes: [],
          functionElement,
        });
      });

      expect(edits.some((e: any) => e.node === abcLNode)).to.be.true;
      expect(edits.some((e: any) => 'parent' in e)).to.be.false;
    });

    it('removes a linked LNode from a SubFunction and adds a new one without a stale reference', () => {
      const doc = setupElementWithDoc(docWithSubFunctionSourceLink);
      const functionElement = doc.querySelector('Function[name="a"]')!;
      const subFunction = functionElement.querySelector(
        'SubFunction[name="sf1"]'
      )!;
      const abcLNode = subFunction.querySelector('LNode')!;
      const defType = doc.querySelector('LNodeType[id="DEF_TYPE"]')!;

      const subfunctions: SubfunctionData[] = [
        {
          name: 'sf1',
          description: null,
          type: null,
          lnodes: [defType],
          element: subFunction,
        },
      ];

      const edits = captureEdits(() => {
        element.updateFunction({
          name: 'a',
          description: null,
          type: null,
          subfunctions,
          lnodes: [],
          functionElement,
        });
      });

      const removeAbc = edits.find((e: any) => e.node === abcLNode);
      const insertDef = edits.find(
        (e: any) =>
          'parent' in e && e.node?.getAttribute?.('lnType') === 'DEF_TYPE'
      );

      expect(removeAbc, 'expected abc LNode to be removed').to.exist;
      expect(insertDef, 'expected def LNode to be inserted into sf1').to.exist;
      expect(insertDef.parent).to.equal(subFunction);
      expect(insertDef.reference).to.not.equal(abcLNode);
    });

    it('removes a whole SubFunction and cleans up its LNode links', () => {
      const doc = setupElementWithDoc(docWithSubFunctionSourceLink);
      const functionElement = doc.querySelector('Function[name="a"]')!;
      const subFunction = functionElement.querySelector(
        'SubFunction[name="sf1"]'
      )!;

      const edits = captureEdits(() => {
        element.updateFunction({
          name: 'a',
          description: null,
          type: null,
          subfunctions: [],
          lnodes: [],
          functionElement,
          removedSubfunctions: [
            {
              name: 'sf1',
              description: null,
              type: null,
              lnodes: [],
              element: subFunction,
            },
          ],
        });
      });

      expect(edits.some((e: any) => e.node === subFunction)).to.be.true;
      expect(
        edits.some(
          (e: any) =>
            e.node &&
            (e.node.tagName === 'Private' || e.node.localName === 'LNodeInputs')
        )
      ).to.be.true;
    });
  });

  describe('getLNodeInsertReference', () => {
    it('excludes a removed sibling from the computed reference and restores it', () => {
      const doc = new DOMParser().parseFromString(
        docWithLinkedFunctionLNode,
        'application/xml'
      );
      const functionElement = doc.querySelector('Function[name="Source"]')!;
      const abcLNode = functionElement.querySelector('LNode')!;

      const reference = (element as any).getLNodeInsertReference(
        functionElement,
        [abcLNode]
      );

      expect(reference).to.not.equal(abcLNode);
      expect(Array.from(functionElement.children)).to.include(abcLNode);
    });

    it('returns the existing LNode sibling when nothing is being removed', () => {
      const doc = new DOMParser().parseFromString(
        docWithLinkedFunctionLNode,
        'application/xml'
      );
      const functionElement = doc.querySelector('Function[name="Source"]')!;
      const abcLNode = functionElement.querySelector('LNode')!;

      const reference = (element as any).getLNodeInsertReference(
        functionElement,
        []
      );

      expect(reference).to.equal(abcLNode);
    });
  });

  describe('without document', () => {
    it('shows a placeholder message', async () => {
      expect(element.shadowRoot?.querySelector('p')).to.contain.text(
        'Please open an SCL document'
      );
    });

    it('does not render sld-editor', async () => {
      expect(element.shadowRoot?.querySelector('sld-editor')).to.not.exist;
    });
  });

  describe('substation button', () => {
    it('is always visible when a doc is present', async () => {
      const doc = new DOMParser().parseFromString(emptyDoc, 'application/xml');
      element.doc = doc;
      await element.updateComplete;
      const button = element.shadowRoot?.querySelector(
        'oscd-filled-icon-button[label="Add Substation"]'
      );
      expect(button).to.exist;
    });

    it('calls insertSubstation when clicked', async () => {
      const doc = new DOMParser().parseFromString(emptyDoc, 'application/xml');
      element.doc = doc;
      await element.updateComplete;

      const insertSpy = spy(element, 'insertSubstation');

      const button = element.shadowRoot?.querySelector(
        'oscd-filled-icon-button[label="Add Substation"]'
      ) as HTMLElement;
      button.click();
      await element.updateComplete;

      expect(insertSpy.calledOnce).to.be.true;
    });

    it('is disabled when functions layer is active', async () => {
      const doc = new DOMParser().parseFromString(
        docWithSubstation,
        'application/xml'
      );
      element.doc = doc;
      await element.updateComplete;
      element.showFunctions = true;
      await element.updateComplete;

      const button = element.shadowRoot?.querySelector(
        'oscd-filled-icon-button[label="Add Substation"]'
      ) as HTMLButtonElement;
      expect(button.disabled).to.be.true;
    });
  });

  describe('voltage level button', () => {
    it('is hidden when no substation exists', async () => {
      const doc = new DOMParser().parseFromString(emptyDoc, 'application/xml');
      element.doc = doc;
      await element.updateComplete;

      const button = element.shadowRoot?.querySelector(
        'oscd-filled-icon-button[label="Add VoltageLevel"]'
      );
      expect(button).to.not.exist;
    });

    it('is visible when substation exists', async () => {
      const doc = new DOMParser().parseFromString(
        docWithSubstation,
        'application/xml'
      );
      element.doc = doc;
      await element.updateComplete;

      const button = element.shadowRoot?.querySelector(
        'oscd-filled-icon-button[label="Add VoltageLevel"]'
      );
      expect(button).to.exist;
    });

    it('starts placing voltage level element when clicked', async () => {
      const doc = new DOMParser().parseFromString(
        docWithSubstation,
        'application/xml'
      );
      element.doc = doc;
      await element.updateComplete;

      const placingSpy = spy(element, 'startPlacing');

      const button = element.shadowRoot?.querySelector(
        'oscd-filled-icon-button[label="Add VoltageLevel"]'
      ) as HTMLElement;
      button.click();
      await element.updateComplete;

      expect(placingSpy.calledOnce).to.be.true;
      const placedElement = placingSpy.firstCall.args[0] as Element;
      expect(placedElement.tagName).to.equal('VoltageLevel');
    });

    it('is disabled when functions layer is active', async () => {
      element.showFunctions = true;
      const doc = new DOMParser().parseFromString(
        docWithSubstation,
        'application/xml'
      );
      element.doc = doc;
      await element.updateComplete;
      await element.updateComplete;

      const button = element.shadowRoot?.querySelector(
        'oscd-filled-icon-button[label="Add VoltageLevel"]'
      ) as HTMLButtonElement;
      expect(button.disabled).to.be.true;
    });
  });

  describe('bay and busbar buttons', () => {
    it('are hidden when no voltage level exists', async () => {
      const doc = new DOMParser().parseFromString(
        docWithSubstation,
        'application/xml'
      );
      element.doc = doc;
      await element.updateComplete;

      const bayButton = element.shadowRoot?.querySelector(
        'oscd-filled-icon-button[label="Add Bay"]'
      );
      const busbarButton = element.shadowRoot?.querySelector(
        'oscd-icon-button[label="Add Bus Bar"]'
      );
      expect(bayButton).to.not.exist;
      expect(busbarButton).to.not.exist;
    });

    it('are visible when voltage level exists', async () => {
      const doc = new DOMParser().parseFromString(
        docWithVoltageLevel,
        'application/xml'
      );
      element.doc = doc;
      await element.updateComplete;

      const bayButton = element.shadowRoot?.querySelector(
        'oscd-filled-icon-button[label="Add Bay"]'
      );
      const busbarButton = element.shadowRoot?.querySelector(
        'oscd-icon-button[label="Add Bus Bar"]'
      );
      expect(bayButton).to.exist;
      expect(busbarButton).to.exist;
    });

    it('bay button starts placing bay element when clicked', async () => {
      const doc = new DOMParser().parseFromString(
        docWithVoltageLevel,
        'application/xml'
      );
      element.doc = doc;
      await element.updateComplete;

      const placingSpy = spy(element, 'startPlacing');

      const button = element.shadowRoot?.querySelector(
        'oscd-filled-icon-button[label="Add Bay"]'
      ) as HTMLElement;
      button.click();
      await element.updateComplete;

      expect(placingSpy.calledOnce).to.be.true;
      const placedElement = placingSpy.firstCall.args[0] as Element;
      expect(placedElement.tagName).to.equal('Bay');
    });

    it('busbar button starts placing busbar element when clicked', async () => {
      const doc = new DOMParser().parseFromString(
        docWithVoltageLevel,
        'application/xml'
      );
      element.doc = doc;
      await element.updateComplete;

      const placingSpy = spy(element, 'startPlacing');

      const button = element.shadowRoot?.querySelector(
        'oscd-icon-button[label="Add Bus Bar"]'
      ) as HTMLElement;
      button.click();
      await element.updateComplete;

      expect(placingSpy.calledOnce).to.be.true;
      const placedElement = placingSpy.firstCall.args[0] as Element;
      expect(placedElement.tagName).to.equal('Bay');
    });
  });

  describe('equipment buttons', () => {
    it('are hidden when no bays exist', async () => {
      const doc = new DOMParser().parseFromString(
        docWithVoltageLevel,
        'application/xml'
      );
      element.doc = doc;
      await element.updateComplete;

      for (const type of eqTypes) {
        const button = element.shadowRoot?.querySelector(
          `oscd-icon-button[label="Add ${type}"]`
        );
        expect(button).to.not.exist;
      }
    });

    it('are visible when at least one bay is not a busbar', async () => {
      const doc = new DOMParser().parseFromString(
        docWithBay,
        'application/xml'
      );
      element.doc = doc;
      await element.updateComplete;

      for (const type of eqTypes) {
        const button = element.shadowRoot?.querySelector(
          `oscd-icon-button[label="Add ${type}"]`
        );
        expect(button).to.exist;
      }
    });

    it('are hidden when all bays are busbars', async () => {
      const doc = new DOMParser().parseFromString(
        docWithBusBarBay,
        'application/xml'
      );
      element.doc = doc;
      await element.updateComplete;

      for (const type of eqTypes) {
        const button = element.shadowRoot?.querySelector(
          `oscd-icon-button[label="Add ${type}"]`
        );
        expect(button).to.not.exist;
      }
    });

    it('create conducting equipment with correct type when clicked', async () => {
      const doc = new DOMParser().parseFromString(
        docWithBay,
        'application/xml'
      );
      element.doc = doc;
      await element.updateComplete;

      const placingSpy = spy(element, 'startPlacing');

      const cabButton = element.shadowRoot?.querySelector(
        'oscd-icon-button[label="Add CAB"]'
      ) as HTMLElement;
      cabButton.click();
      await element.updateComplete;

      expect(placingSpy.calledOnce).to.be.true;
      const placedElement = placingSpy.firstCall.args[0] as Element;
      expect(placedElement.tagName).to.equal('ConductingEquipment');
      expect(placedElement.getAttribute('type')).to.equal('CAB');
    });
  });

  describe('transformer buttons', () => {
    it('are hidden when no substation exists', async () => {
      const doc = new DOMParser().parseFromString(emptyDoc, 'application/xml');
      element.doc = doc;
      await element.updateComplete;

      const transformerButtons = element.shadowRoot?.querySelectorAll(
        'oscd-icon-button[label*="Transformer"]'
      );
      expect(transformerButtons?.length).to.equal(0);
    });

    it('are visible when substation exists', async () => {
      const doc = new DOMParser().parseFromString(
        docWithSubstation,
        'application/xml'
      );
      element.doc = doc;
      await element.updateComplete;

      const transformerButtons = element.shadowRoot?.querySelectorAll(
        'oscd-icon-button[label*="Transformer"]'
      );
      expect(transformerButtons!.length).to.be.greaterThan(0);
    });

    it('creates single winding auto transformer when clicked', async () => {
      const doc = new DOMParser().parseFromString(
        docWithSubstation,
        'application/xml'
      );
      element.doc = doc;
      await element.updateComplete;

      const placingSpy = spy(element, 'startPlacing');

      const button = element.shadowRoot?.querySelector(
        'oscd-icon-button[label="Add Single Winding Auto Transformer"]'
      ) as HTMLElement;
      button.click();
      await element.updateComplete;

      expect(placingSpy.calledOnce).to.be.true;
      const placedElement = placingSpy.firstCall.args[0] as Element;
      expect(placedElement.tagName).to.equal('PowerTransformer');
      expect(placedElement.getAttribute('type')).to.equal('PTR');
      const windings = Array.from(placedElement.children).filter(
        child => child.tagName === 'TransformerWinding'
      );
      expect(windings.length).to.equal(1);
    });

    it('creates two winding transformer when clicked', async () => {
      const doc = new DOMParser().parseFromString(
        docWithSubstation,
        'application/xml'
      );
      element.doc = doc;
      await element.updateComplete;

      const placingSpy = spy(element, 'startPlacing');

      const button = element.shadowRoot?.querySelector(
        'oscd-icon-button[label="Add Two Winding Transformer"]'
      ) as HTMLElement;
      button.click();
      await element.updateComplete;

      expect(placingSpy.calledOnce).to.be.true;
      const placedElement = placingSpy.firstCall.args[0] as Element;
      expect(placedElement.tagName).to.equal('PowerTransformer');
      expect(placedElement.children.length).to.equal(2);
    });

    it('creates three winding transformer when clicked', async () => {
      const doc = new DOMParser().parseFromString(
        docWithSubstation,
        'application/xml'
      );
      element.doc = doc;
      await element.updateComplete;

      const placingSpy = spy(element, 'startPlacing');

      const button = element.shadowRoot?.querySelector(
        'oscd-icon-button[label="Add Three Winding Transformer"]'
      ) as HTMLElement;
      button.click();
      await element.updateComplete;

      expect(placingSpy.calledOnce).to.be.true;
      const placedElement = placingSpy.firstCall.args[0] as Element;
      expect(placedElement.tagName).to.equal('PowerTransformer');
      expect(placedElement.children.length).to.equal(3);
    });
  });

  describe('zoom controls', () => {
    it('are hidden when no substation exists', async () => {
      const doc = new DOMParser().parseFromString(emptyDoc, 'application/xml');
      element.doc = doc;
      await element.updateComplete;

      const zoomIn = element.shadowRoot?.querySelector(
        'oscd-icon-button[label="Zoom In"]'
      );
      const zoomOut = element.shadowRoot?.querySelector(
        'oscd-icon-button[label="Zoom Out"]'
      );
      expect(zoomIn).to.not.exist;
      expect(zoomOut).to.not.exist;
    });

    it('are visible when substation exists', async () => {
      const doc = new DOMParser().parseFromString(
        docWithSubstation,
        'application/xml'
      );
      element.doc = doc;
      await element.updateComplete;

      const zoomIn = element.shadowRoot?.querySelector(
        'oscd-icon-button[label="Zoom In"]'
      );
      const zoomOut = element.shadowRoot?.querySelector(
        'oscd-icon-button[label="Zoom Out"]'
      );
      expect(zoomIn).to.exist;
      expect(zoomOut).to.exist;
    });

    it('increases gridSize when zoom in is clicked', async () => {
      const doc = new DOMParser().parseFromString(
        docWithSubstation,
        'application/xml'
      );
      element.doc = doc;
      await element.updateComplete;

      const initialSize = element.gridSize;
      const button = element.shadowRoot?.querySelector(
        'oscd-icon-button[label="Zoom In"]'
      ) as HTMLElement;
      button.click();
      await element.updateComplete;

      expect(element.gridSize).to.equal(initialSize + 3);
    });

    it('decreases gridSize when zoom out is clicked', async () => {
      const doc = new DOMParser().parseFromString(
        docWithSubstation,
        'application/xml'
      );
      element.doc = doc;
      await element.updateComplete;

      const initialSize = element.gridSize;
      const button = element.shadowRoot?.querySelector(
        'oscd-icon-button[label="Zoom Out"]'
      ) as HTMLElement;
      button.click();
      await element.updateComplete;

      expect(element.gridSize).to.equal(initialSize - 3);
    });

    it('does not zoom below minimum gridSize', async () => {
      const doc = new DOMParser().parseFromString(
        docWithSubstation,
        'application/xml'
      );
      element.doc = doc;
      element.gridSize = 2;
      await element.updateComplete;

      element.zoomOut();
      expect(element.gridSize).to.equal(2);
    });
  });

  describe('label toggle', () => {
    it('is hidden when no voltage level or transformer exists', async () => {
      const doc = new DOMParser().parseFromString(
        docWithSubstation,
        'application/xml'
      );
      element.doc = doc;
      await element.updateComplete;

      const toggle = element.shadowRoot?.querySelector('#labels');
      expect(toggle).to.not.exist;
    });

    it('is visible when voltage level exists', async () => {
      const doc = new DOMParser().parseFromString(
        docWithVoltageLevel,
        'application/xml'
      );
      element.doc = doc;
      await element.updateComplete;

      const toggle = element.shadowRoot?.querySelector('#labels');
      expect(toggle).to.exist;
    });
  });

  describe('function links toggle', () => {
    it('renders function links toggle when functions exist', async () => {
      const doc = new DOMParser().parseFromString(
        docWithBayAndFunctions,
        'application/xml'
      );
      element.doc = doc;
      await element.updateComplete;

      const toggle = element.shadowRoot?.querySelector('#function-links');
      expect(toggle).to.exist;
    });

    it('toggles showFunctionLinks and passes it to functions-layer', async () => {
      const doc = new DOMParser().parseFromString(
        docWithBayAndFunctions,
        'application/xml'
      );
      element.doc = doc;
      element.showFunctions = true;
      await element.updateComplete;

      const toggle = element.shadowRoot?.querySelector(
        '#function-links'
      ) as HTMLElement;
      expect(toggle).to.exist;

      const layerBefore = element.shadowRoot?.querySelector(
        'functions-layer'
      ) as any;
      expect(layerBefore.showLinks).to.be.true;

      toggle.click();
      await element.updateComplete;

      expect(element.showFunctionLinks).to.be.false;
      const layerAfter = element.shadowRoot?.querySelector(
        'functions-layer'
      ) as any;
      expect(layerAfter.showLinks).to.be.false;
    });
  });

  describe('startPlacing method', () => {
    it('resets state before starting placement', async () => {
      const doc = new DOMParser().parseFromString(
        docWithBay,
        'application/xml'
      );
      element.doc = doc;
      await element.updateComplete;

      const resetSpy = spy(element, 'reset');
      const testElement = doc.createElement('Bay');

      element.startPlacing(testElement);

      expect(resetSpy.calledOnce).to.be.true;
    });
  });

  describe('reset method', () => {
    it('sets inAction to false', async () => {
      element.sldEditorInAction = true;
      expect(element.inAction).to.be.true;
      element.reset();
      expect(element.inAction).to.be.false;
    });
  });

  describe('function placement', () => {
    it('starts placing function when handleStartPlaceFunction is called', async () => {
      const doc = new DOMParser().parseFromString(
        docWithBay,
        'application/xml'
      );
      element.doc = doc;
      await element.updateComplete;

      const functionElement = doc.createElement('Function');
      functionElement.setAttribute('name', 'TestFunction');

      element.handleStartPlaceFunction(functionElement, [1, 2]);
      await element.updateComplete;

      expect(element.placingFunction).to.equal(functionElement);
      expect(element.placingFunctionOffset).to.deep.equal([1, 2]);
      expect(element.functionsInAction).to.be.true;
      expect(element.inAction).to.be.true;
    });

    it('resets function placement on Escape key', async () => {
      const doc = new DOMParser().parseFromString(
        docWithBay,
        'application/xml'
      );
      element.doc = doc;
      await element.updateComplete;

      const functionElement = doc.createElement('Function');
      element.handleStartPlaceFunction(functionElement, [0, 0]);
      await element.updateComplete;

      expect(element.placingFunction).to.exist;

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      window.dispatchEvent(escapeEvent);
      await element.updateComplete;

      expect(element.placingFunction).to.be.undefined;
      expect(element.functionsInAction).to.be.false;
    });

    it('resets placing function when functions-layer calls onDonePlaceFunction', async () => {
      const doc = new DOMParser().parseFromString(
        docWithBay,
        'application/xml'
      );
      element.doc = doc;
      element.showFunctions = true;
      await element.updateComplete;

      const functionElement = doc.createElement('Function');
      element.placingFunction = functionElement;
      element.functionsInAction = true;
      await element.updateComplete;

      const functionsLayer = element.shadowRoot?.querySelector(
        'functions-layer'
      ) as any;
      functionsLayer.onDonePlaceFunction();
      await element.updateComplete;

      expect(element.placingFunction).to.be.undefined;
      expect(element.functionsInAction).to.be.false;
    });
  });

  describe('function layer state management', () => {
    it('updates inAction when functionsInAction changes', async () => {
      element.functionsInAction = true;
      expect(element.inAction).to.be.true;

      element.functionsInAction = false;
      expect(element.inAction).to.be.false;
    });

    it('sets inAction when either sldEditor or functions are in action', async () => {
      element.sldEditorInAction = true;
      element.functionsInAction = false;
      expect(element.inAction).to.be.true;

      element.sldEditorInAction = false;
      element.functionsInAction = true;
      expect(element.inAction).to.be.true;

      element.sldEditorInAction = true;
      element.functionsInAction = true;
      expect(element.inAction).to.be.true;
    });

    it('clears inAction when both states are false', async () => {
      element.sldEditorInAction = false;
      element.functionsInAction = false;
      expect(element.inAction).to.be.false;
    });
  });

  describe('reset method with functions', () => {
    it('resets function placement state', async () => {
      const doc = new DOMParser().parseFromString(
        docWithBay,
        'application/xml'
      );
      element.doc = doc;
      await element.updateComplete;

      const functionElement = doc.createElement('Function');
      element.placingFunction = functionElement;
      element.placingFunctionOffset = [5, 10];
      element.functionsInAction = true;

      element.reset();

      expect(element.placingFunction).to.be.undefined;
      expect(element.placingFunctionOffset).to.deep.equal([0, 0]);
      expect(element.functionsInAction).to.be.false;
      expect(element.inAction).to.be.false;
    });

    it('resets both sldEditor and function states', async () => {
      element.sldEditorInAction = true;
      element.functionsInAction = true;

      element.reset();

      expect(element.sldEditorInAction).to.be.false;
      expect(element.functionsInAction).to.be.false;
      expect(element.inAction).to.be.false;
    });
  });

  describe('disconnectedCallback with functions', () => {
    it('removes keydown listener on disconnect', async () => {
      const doc = new DOMParser().parseFromString(
        docWithBay,
        'application/xml'
      );
      element.doc = doc;
      await element.updateComplete;

      const functionElement = doc.createElement('Function');
      element.handleStartPlaceFunction(functionElement, [0, 0]);
      await element.updateComplete;

      expect(element.placingFunction).to.exist;

      element.disconnectedCallback();

      // Keydown event should not affect the element after disconnection
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      window.dispatchEvent(escapeEvent);

      // The placing function should still exist since handler was removed
      expect(element.placingFunction).to.exist;
    });
  });

  describe('Cancel button', () => {
    it('resets state when clicked', async () => {
      const doc = new DOMParser().parseFromString(
        docWithBay,
        'application/xml'
      );
      element.doc = doc;
      element.sldEditorInAction = true;
      await element.updateComplete;

      const cancelBtn = element.shadowRoot?.querySelector(
        'oscd-icon-button[label="Cancel"]'
      ) as HTMLElement;

      cancelBtn.click();
      await element.updateComplete;

      expect(element.sldEditorInAction).to.be.false;
      expect(element.functionsInAction).to.be.false;
      expect(element.inAction).to.be.false;
    });

    it('toggles function layer visibility when adding function', async () => {
      const doc = new DOMParser().parseFromString(
        docWithBay,
        'application/xml'
      );
      element.doc = doc;
      await element.updateComplete;

      const addFunctionButton = element.shadowRoot?.querySelector(
        'oscd-icon-button[label="Add Function"]'
      ) as HTMLElement;

      addFunctionButton.click();
      await element.updateComplete;

      expect(element.addingFunction).to.be.true;
      expect(element.showFunctions).to.be.true;

      const cancelBtn = element.shadowRoot?.querySelector(
        'oscd-icon-button[label="Cancel"]'
      ) as HTMLElement;

      cancelBtn.click();
      await element.updateComplete;
      expect(element.addingFunction).to.be.false;
      expect(element.showFunctions).to.be.false;
    });
  });

  describe('cancel add function dialog', () => {
    it('restores highlight state when dialog is canceled', async () => {
      const doc = new DOMParser().parseFromString(
        docWithElements,
        'application/xml'
      );
      element.doc = doc;
      await element.updateComplete;

      const addFunctionButton = element.shadowRoot?.querySelector(
        'oscd-icon-button[label="Add Function"]'
      ) as HTMLElement;
      addFunctionButton.click();
      await element.updateComplete;

      expect(element.addingFunction).to.be.true;
      expect(element.highlight.length).to.be.greaterThan(0);
      const initialHighlightCount = element.highlight.length;

      expect(element.highlightBeforeAddingFunction.length).to.equal(
        initialHighlightCount
      );

      const bay = doc.querySelector('Bay')!;
      element.handleSldSelected({
        detail: { element: bay },
      } as CustomEvent<{ element: Element }>);
      await element.updateComplete;

      expect(element.highlight.length).to.equal(1);
      expect(element.selectedElement).to.equal(bay);
      expect(element.addingFunction).to.be.false;

      const dialog = element.shadowRoot?.querySelector(
        'create-function-dialog'
      ) as any;
      expect(dialog).to.exist;

      dialog.handleClosed();
      await element.updateComplete;

      expect(element.highlight.length).to.equal(initialHighlightCount);
      expect(element.addingFunction).to.be.true;
      expect(element.selectedElement).to.be.undefined;
    });
  });

  describe('function link flow', () => {
    it('collects Function and EqFunction source candidates in same bay from selected sink LNode', async () => {
      const doc = new DOMParser().parseFromString(
        docForFunctionLinkFlow,
        'application/xml'
      );
      element.doc = doc;
      await element.updateComplete;

      const sinkFunction = doc.querySelector('Function[name="F1"]')!;
      const sinkLNode = sinkFunction.querySelector('LNode')!;

      (element as any).handleCreateFunctionLink({
        functionElement: sinkFunction,
        subFunctionElement: null,
        lNodeElement: sinkLNode,
      });

      expect((element as any).selectingLinkSource).to.be.true;
      expect((element as any).linkSourceCandidates.length).to.equal(3);
      expect(
        (element as any).linkSourceCandidates.map((fn: Element) =>
          fn.getAttribute('name')
        )
      ).to.deep.equal(['F1', 'F2', 'EF1']);
    });

    it('includes EqFunction nested under ConductingEquipment in source candidates', async () => {
      const doc = new DOMParser().parseFromString(
        docWithAllElements,
        'application/xml'
      );
      element.doc = doc;
      await element.updateComplete;

      const sinkFunction = doc.querySelector('Function[name="F1"]')!;
      const sinkLNode = sinkFunction.querySelector('LNode')!;

      (element as any).handleCreateFunctionLink({
        functionElement: sinkFunction,
        subFunctionElement: null,
        lNodeElement: sinkLNode,
      });

      expect(
        (element as any).linkSourceCandidates.map((fn: Element) =>
          fn.getAttribute('name')
        )
      ).to.deep.equal(['F1', 'F2', 'EF1', 'Q1F']);
    });

    it('opens function link dialog after selecting an applicable source function', async () => {
      const doc = new DOMParser().parseFromString(
        docWithAllElements,
        'application/xml'
      );
      element.doc = doc;
      await element.updateComplete;

      const sinkFunction = doc.querySelector('Function[name="F1"]')!;
      const sinkLNode = sinkFunction.querySelector('LNode')!;
      const sourceFunction = doc.querySelector('Function[name="F2"]')!;

      (element as any).handleCreateFunctionLink({
        functionElement: sinkFunction,
        subFunctionElement: null,
        lNodeElement: sinkLNode,
      });

      (element as any).handleSelectSourceFunction(sourceFunction);
      await element.updateComplete;
      await new Promise<void>(resolve => {
        requestAnimationFrame(() => resolve());
      });
      await element.updateComplete;

      const dialog = element.shadowRoot?.querySelector(
        'function-link-dialog'
      ) as any;
      expect(dialog).to.exist;
      expect(dialog.sourceFunctionName).to.equal('F2');
      expect(dialog.sourceFunctionPath).to.equal('S1/V1/B1/F2');
    });

    it('creates SourceRef link with service GOOSE and expected attributes', async () => {
      const doc = new DOMParser().parseFromString(
        docWithSinkFunction,
        'application/xml'
      );
      element.doc = doc;
      await element.updateComplete;

      const sinkFunction = doc.querySelector('Function[name="Sink"]')!;
      const sinkLNode = sinkFunction.querySelector('LNode')!;

      (element as any).pendingLinkContext = {
        functionElement: sinkFunction,
        subFunctionElement: null,
        lNodeElement: sinkLNode,
      };

      const dispatchSpy = spy(element, 'dispatchEvent');

      (element as any).handleConnectFunctionLink({
        detail: {
          service: 'GOOSE',
          selectedReferences: [
            {
              id: 'ref-1',
              groupKey: 'function|TCTR1',
              groupLabel: 'TCTR1 · function level',
              lnodeName: 'TCTR1',
              lnClass: 'TCTR',
              lnInst: '1',
              doName: 'Amp',
              daPath: 'instMag.f',
              shortPath: 'Amp.instMag.f',
              fullSource: 'S1/V1/B1/Source/TCTR1.Amp.instMag.f',
            },
          ],
        },
      } as CustomEvent);

      const editCall = dispatchSpy.args.find(
        args => (args[0] as CustomEvent).type === 'oscd-edit-v2'
      );
      expect(editCall, 'Expected oscd-edit-v2 event').to.exist;

      const { edit } = (editCall![0] as CustomEvent).detail;
      const createEdit = Array.isArray(edit) ? edit[0] : edit;
      const privateElement = createEdit.node as Element;
      const sourceRefContainer = Array.from(
        privateElement.querySelectorAll('*')
      ).find(node => node.localName === 'LNodeInputs') as Element;
      const sourceRef = Array.from(privateElement.querySelectorAll('*')).find(
        node => node.localName === 'SourceRef'
      ) as Element;

      expect(sourceRefContainer).to.exist;
      expect(sourceRef).to.exist;
      expect(sourceRef.getAttribute('service')).to.equal('GOOSE');
      expect(sourceRef.getAttribute('source')).to.equal(
        'S1/V1/B1/Source/TCTR1.Amp.instMag.f'
      );
      expect(sourceRef.getAttribute('input')).to.equal('TCTR1.Amp.instMag.f');
      expect(sourceRef.getAttribute('pLN')).to.equal('TCTR');
      expect(sourceRef.getAttribute('pDO')).to.equal('Amp');
      expect(sourceRef.getAttribute('pDA')).to.equal('instMag.f');

      dispatchSpy.restore();
    });

    it('does not create a link when function-link dialog is closed', async () => {
      const doc = new DOMParser().parseFromString(
        docWithSinkFunction,
        'application/xml'
      );
      element.doc = doc;
      await element.updateComplete;

      const sinkFunction = doc.querySelector('Function[name="Sink"]')!;
      const sinkLNode = sinkFunction.querySelector('LNode')!;

      (element as any).pendingLinkContext = {
        functionElement: sinkFunction,
        subFunctionElement: null,
        lNodeElement: sinkLNode,
      };
      (element as any).selectingLinkSource = true;
      (element as any).linkSourceCandidates = [sinkFunction];

      const dispatchSpy = spy(element, 'dispatchEvent');

      const dialog = element.shadowRoot?.querySelector('function-link-dialog');
      dialog?.dispatchEvent(
        new CustomEvent('close-function-link-dialog', {
          bubbles: true,
          composed: true,
        })
      );

      await element.updateComplete;

      const editCall = dispatchSpy.args.find(
        args => (args[0] as CustomEvent).type === 'oscd-edit-v2'
      );
      expect(editCall).to.not.exist;
      expect((element as any).pendingLinkContext).to.equal(null);
      expect((element as any).selectingLinkSource).to.be.false;
      expect((element as any).linkSourceCandidates).to.deep.equal([]);

      dispatchSpy.restore();
    });
  });
});
