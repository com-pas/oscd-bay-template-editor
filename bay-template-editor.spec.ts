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
} from './bay-template-editor.testfiles.js';
import { eqTypes, SubfunctionData, LNodeData } from './util.js';

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
      lnodes: LNodeData[] = []
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
      const { parent, node } = edit;
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
        { lnClass: 'LLN0', desc: 'desc' },
        { lnClass: 'XCBR', desc: 'desc' },
      ];
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
      const lnodes = [{ lnClass: 'XCBR', desc: 'breaker' }];

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
        `<?xml version="1.0" encoding="UTF-8"?>
        <SCL xmlns="http://www.iec.ch/61850/2003/SCL" version="2007" revision="B">
          <Substation name="S1">
            <VoltageLevel name="V1">
              <Bay name="B1">
                <Function name="F1"><LNode lnClass="LLN0" /></Function>
                <Function name="F2" />
                <EqFunction name="EF1" />
              </Bay>
            </VoltageLevel>
          </Substation>
        </SCL>`,
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
        `<?xml version="1.0" encoding="UTF-8"?>
        <SCL xmlns="http://www.iec.ch/61850/2003/SCL" version="2007" revision="B">
          <Substation name="S1">
            <VoltageLevel name="V1">
              <Bay name="B1">
                <Function name="F1"><LNode lnClass="LLN0" /></Function>
                <ConductingEquipment name="Q1">
                  <EqFunction name="Q1F" />
                </ConductingEquipment>
              </Bay>
            </VoltageLevel>
          </Substation>
        </SCL>`,
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
      ).to.deep.equal(['F1', 'Q1F']);
    });

    it('opens function link dialog after selecting an applicable source function', async () => {
      const doc = new DOMParser().parseFromString(
        `<?xml version="1.0" encoding="UTF-8"?>
        <SCL xmlns="http://www.iec.ch/61850/2003/SCL" version="2007" revision="B">
          <Substation name="S1">
            <VoltageLevel name="V1">
              <Bay name="B1">
                <Function name="F1"><LNode lnClass="LLN0" /></Function>
                <Function name="F2" />
              </Bay>
            </VoltageLevel>
          </Substation>
        </SCL>`,
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
  });
});
