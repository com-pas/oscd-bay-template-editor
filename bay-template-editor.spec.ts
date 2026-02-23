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
} from './bay-template-editor.testfiles.js';
import { eqTypes } from './util.js';

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

    it('shows only substation button', async () => {
      const outlinedButtons =
        element.shadowRoot?.querySelectorAll('oscd-icon-button');
      const filledButtons = element.shadowRoot?.querySelectorAll(
        'oscd-filled-icon-button'
      );
      expect(outlinedButtons?.length).to.equal(0);
      expect(filledButtons?.length).to.equal(1);
      expect(filledButtons?.[0].getAttribute('label')).to.equal(
        'Add Substation'
      );
    });
  });

  describe('substation button', () => {
    it('is always visible', async () => {
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
      element.inAction = true;
      element.reset();
      expect(element.inAction).to.be.false;
    });
  });

  describe('preprocessEdits method', () => {
    it('assigns unique names to elements without names when inserted', async () => {
      const doc = new DOMParser().parseFromString(
        docWithBay,
        'application/xml'
      );
      element.doc = doc;
      await element.updateComplete;

      const bay = doc.querySelector('Bay')!;
      const newEquipment = doc.createElementNS(
        doc.documentElement.namespaceURI,
        'ConductingEquipment'
      );
      newEquipment.setAttribute('type', 'CBR');

      const editEvent = new CustomEvent('oscd-edit-v2', {
        detail: {
          node: newEquipment,
          parent: bay,
          reference: null,
        },
        bubbles: true,
        composed: true,
      });

      element.dispatchEvent(editEvent);

      expect(newEquipment.getAttribute('name')).to.equal('CBR1');
    });

    it('preserves existing names on elements', async () => {
      const doc = new DOMParser().parseFromString(
        docWithBay,
        'application/xml'
      );
      element.doc = doc;
      await element.updateComplete;

      const bay = doc.querySelector('Bay')!;
      const newEquipment = doc.createElementNS(
        doc.documentElement.namespaceURI,
        'ConductingEquipment'
      );
      newEquipment.setAttribute('type', 'CBR');
      newEquipment.setAttribute('name', 'MyCustomName');

      const editEvent = new CustomEvent('oscd-edit-v2', {
        detail: {
          node: newEquipment,
          parent: bay,
        },
      });

      element.dispatchEvent(editEvent);

      expect(newEquipment.getAttribute('name')).to.equal('MyCustomName');
    });

    it('handles SLD attributes in edits', async () => {
      const doc = new DOMParser().parseFromString(
        docWithBay,
        'application/xml'
      );
      element.doc = doc;
      await element.updateComplete;

      const testElement = doc.createElementNS(
        doc.documentElement.namespaceURI,
        'Bay'
      );

      const editEvent = new CustomEvent('oscd-edit-v2', {
        detail: {
          element: testElement,
          attributesNS: {
            'https://openscd.org/SCL/SSD/SLD/v0': {
              w: '10',
              h: '20',
            },
          },
        },
      });

      element.dispatchEvent(editEvent);

      const sldAttrs = testElement.querySelector(
        'Private[type="OpenSCD-SLD-Layout"] > SLDAttributes'
      );
      expect(sldAttrs).to.exist;
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

    it('resets placing function after edit event', async () => {
      const doc = new DOMParser().parseFromString(
        docWithBay,
        'application/xml'
      );
      element.doc = doc;
      await element.updateComplete;

      const functionElement = doc.createElement('Function');
      element.placingFunction = functionElement;
      await element.updateComplete;

      const editEvent = new CustomEvent('oscd-edit-v2', {
        bubbles: true,
        composed: true,
        detail: {
          parent: doc.querySelector('Bay'),
          node: functionElement,
        },
      });

      element.dispatchEvent(editEvent);
      await element.updateComplete;

      expect(element.placingFunction).to.be.undefined;
    });
  });

  describe('function layer state management', () => {
    it('updates inAction when functionsInAction changes', async () => {
      element.functionsInAction = true;
      element.updateInAction();
      expect(element.inAction).to.be.true;

      element.functionsInAction = false;
      element.updateInAction();
      expect(element.inAction).to.be.false;
    });

    it('sets inAction when either sldEditor or functions are in action', async () => {
      element.sldEditorInAction = true;
      element.functionsInAction = false;
      element.updateInAction();
      expect(element.inAction).to.be.true;

      element.sldEditorInAction = false;
      element.functionsInAction = true;
      element.updateInAction();
      expect(element.inAction).to.be.true;

      element.sldEditorInAction = true;
      element.functionsInAction = true;
      element.updateInAction();
      expect(element.inAction).to.be.true;
    });

    it('clears inAction when both states are false', async () => {
      element.sldEditorInAction = false;
      element.functionsInAction = false;
      element.updateInAction();
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

      // Disconnect the element
      element.disconnectedCallback();

      // Keydown event should not affect the element after disconnection
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      window.dispatchEvent(escapeEvent);

      // The placing function should still exist since handler was removed
      expect(element.placingFunction).to.exist;
    });
  });
});
