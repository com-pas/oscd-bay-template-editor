/* eslint-disable no-unused-expressions */
import { html } from 'lit';
import sinon, { spy } from 'sinon';
import { fixture, expect } from '@open-wc/testing';
import BayTemplatePlugin from './bay-template-editor.js';
import { emptyDoc, docWithSubstation, docWithVoltageLevel, docWithBay, docWithBusBarBay, } from './bay-template-editor.testfiles.js';
import { eqTypes } from './util.js';
if (!customElements.get('oscd-editor-bay-template')) {
    customElements.define('oscd-editor-bay-template', BayTemplatePlugin);
}
describe('Bay Template Editor Plugin', () => {
    let element;
    beforeEach(async () => {
        element = await fixture(html `<oscd-editor-bay-template></oscd-editor-bay-template>`);
        await element.updateComplete;
    });
    afterEach(() => {
        sinon.restore();
    });
    describe('without document', () => {
        it('shows a placeholder message', async () => {
            expect(element.shadowRoot?.querySelector('p')).to.contain.text('Please open an SCL document');
        });
        it('does not render sld-editor', async () => {
            expect(element.shadowRoot?.querySelector('sld-editor')).to.not.exist;
        });
        it('shows only substation button', async () => {
            const buttons = element.shadowRoot?.querySelectorAll('mwc-fab');
            expect(buttons?.length).to.equal(1);
            expect(buttons?.[0].getAttribute('label')).to.equal('Add Substation');
        });
    });
    describe('substation button', () => {
        it('is always visible', async () => {
            const button = element.shadowRoot?.querySelector('mwc-fab[label="Add Substation"]');
            expect(button).to.exist;
        });
        it('calls insertSubstation when clicked', async () => {
            const doc = new DOMParser().parseFromString(emptyDoc, 'application/xml');
            element.doc = doc;
            await element.updateComplete;
            const insertSpy = spy(element, 'insertSubstation');
            const button = element.shadowRoot?.querySelector('mwc-fab[label="Add Substation"]');
            button.click();
            await element.updateComplete;
            expect(insertSpy.calledOnce).to.be.true;
        });
    });
    describe('voltage level button', () => {
        it('is hidden when no substation exists', async () => {
            const doc = new DOMParser().parseFromString(emptyDoc, 'application/xml');
            element.doc = doc;
            await element.updateComplete;
            const button = element.shadowRoot?.querySelector('mwc-fab[label="Add VoltageLevel"]');
            expect(button).to.not.exist;
        });
        it('is visible when substation exists', async () => {
            const doc = new DOMParser().parseFromString(docWithSubstation, 'application/xml');
            element.doc = doc;
            await element.updateComplete;
            const button = element.shadowRoot?.querySelector('mwc-fab[label="Add VoltageLevel"]');
            expect(button).to.exist;
        });
        it('starts placing voltage level element when clicked', async () => {
            const doc = new DOMParser().parseFromString(docWithSubstation, 'application/xml');
            element.doc = doc;
            await element.updateComplete;
            const placingSpy = spy(element, 'startPlacing');
            const button = element.shadowRoot?.querySelector('mwc-fab[label="Add VoltageLevel"]');
            button.click();
            await element.updateComplete;
            expect(placingSpy.calledOnce).to.be.true;
            const placedElement = placingSpy.firstCall.args[0];
            expect(placedElement.tagName).to.equal('VoltageLevel');
        });
    });
    describe('bay and busbar buttons', () => {
        it('are hidden when no voltage level exists', async () => {
            const doc = new DOMParser().parseFromString(docWithSubstation, 'application/xml');
            element.doc = doc;
            await element.updateComplete;
            const bayButton = element.shadowRoot?.querySelector('mwc-fab[label="Add Bay"]');
            const busbarButton = element.shadowRoot?.querySelector('mwc-fab[label="Add Bus Bar"]');
            expect(bayButton).to.not.exist;
            expect(busbarButton).to.not.exist;
        });
        it('are visible when voltage level exists', async () => {
            const doc = new DOMParser().parseFromString(docWithVoltageLevel, 'application/xml');
            element.doc = doc;
            await element.updateComplete;
            const bayButton = element.shadowRoot?.querySelector('mwc-fab[label="Add Bay"]');
            const busbarButton = element.shadowRoot?.querySelector('mwc-fab[label="Add Bus Bar"]');
            expect(bayButton).to.exist;
            expect(busbarButton).to.exist;
        });
        it('bay button starts placing bay element when clicked', async () => {
            const doc = new DOMParser().parseFromString(docWithVoltageLevel, 'application/xml');
            element.doc = doc;
            await element.updateComplete;
            const placingSpy = spy(element, 'startPlacing');
            const button = element.shadowRoot?.querySelector('mwc-fab[label="Add Bay"]');
            button.click();
            await element.updateComplete;
            expect(placingSpy.calledOnce).to.be.true;
            const placedElement = placingSpy.firstCall.args[0];
            expect(placedElement.tagName).to.equal('Bay');
        });
        it('busbar button starts placing busbar element when clicked', async () => {
            const doc = new DOMParser().parseFromString(docWithVoltageLevel, 'application/xml');
            element.doc = doc;
            await element.updateComplete;
            const placingSpy = spy(element, 'startPlacing');
            const button = element.shadowRoot?.querySelector('mwc-fab[label="Add Bus Bar"]');
            button.click();
            await element.updateComplete;
            expect(placingSpy.calledOnce).to.be.true;
            const placedElement = placingSpy.firstCall.args[0];
            expect(placedElement.tagName).to.equal('Bay');
        });
    });
    describe('equipment buttons', () => {
        it('are hidden when no bays exist', async () => {
            const doc = new DOMParser().parseFromString(docWithVoltageLevel, 'application/xml');
            element.doc = doc;
            await element.updateComplete;
            for (const type of eqTypes) {
                const button = element.shadowRoot?.querySelector(`mwc-fab[label="Add ${type}"]`);
                expect(button).to.not.exist;
            }
        });
        it('are visible when at least one bay is not a busbar', async () => {
            const doc = new DOMParser().parseFromString(docWithBay, 'application/xml');
            element.doc = doc;
            await element.updateComplete;
            for (const type of eqTypes) {
                const button = element.shadowRoot?.querySelector(`mwc-fab[label="Add ${type}"]`);
                expect(button).to.exist;
            }
        });
        it('are hidden when all bays are busbars', async () => {
            const doc = new DOMParser().parseFromString(docWithBusBarBay, 'application/xml');
            element.doc = doc;
            await element.updateComplete;
            for (const type of eqTypes) {
                const button = element.shadowRoot?.querySelector(`mwc-fab[label="Add ${type}"]`);
                expect(button).to.not.exist;
            }
        });
        it('create conducting equipment with correct type when clicked', async () => {
            const doc = new DOMParser().parseFromString(docWithBay, 'application/xml');
            element.doc = doc;
            await element.updateComplete;
            const placingSpy = spy(element, 'startPlacing');
            const cabButton = element.shadowRoot?.querySelector('mwc-fab[label="Add CAB"]');
            cabButton.click();
            await element.updateComplete;
            expect(placingSpy.calledOnce).to.be.true;
            const placedElement = placingSpy.firstCall.args[0];
            expect(placedElement.tagName).to.equal('ConductingEquipment');
            expect(placedElement.getAttribute('type')).to.equal('CAB');
        });
    });
    describe('transformer buttons', () => {
        it('are hidden when no substation exists', async () => {
            const doc = new DOMParser().parseFromString(emptyDoc, 'application/xml');
            element.doc = doc;
            await element.updateComplete;
            const transformerButtons = element.shadowRoot?.querySelectorAll('mwc-fab[label*="Transformer"]');
            expect(transformerButtons?.length).to.equal(0);
        });
        it('are visible when substation exists', async () => {
            const doc = new DOMParser().parseFromString(docWithSubstation, 'application/xml');
            element.doc = doc;
            await element.updateComplete;
            const transformerButtons = element.shadowRoot?.querySelectorAll('mwc-fab[label*="Transformer"]');
            expect(transformerButtons.length).to.be.greaterThan(0);
        });
        it('creates single winding auto transformer when clicked', async () => {
            const doc = new DOMParser().parseFromString(docWithSubstation, 'application/xml');
            element.doc = doc;
            await element.updateComplete;
            const placingSpy = spy(element, 'startPlacing');
            const button = element.shadowRoot?.querySelector('mwc-fab[label="Add Single Winding Auto Transformer"]');
            button.click();
            await element.updateComplete;
            expect(placingSpy.calledOnce).to.be.true;
            const placedElement = placingSpy.firstCall.args[0];
            expect(placedElement.tagName).to.equal('PowerTransformer');
            expect(placedElement.getAttribute('type')).to.equal('PTR');
            const windings = Array.from(placedElement.children).filter(child => child.tagName === 'TransformerWinding');
            expect(windings.length).to.equal(1);
        });
        it('creates two winding transformer when clicked', async () => {
            const doc = new DOMParser().parseFromString(docWithSubstation, 'application/xml');
            element.doc = doc;
            await element.updateComplete;
            const placingSpy = spy(element, 'startPlacing');
            const button = element.shadowRoot?.querySelector('mwc-fab[label="Add Two Winding Transformer"]');
            button.click();
            await element.updateComplete;
            expect(placingSpy.calledOnce).to.be.true;
            const placedElement = placingSpy.firstCall.args[0];
            expect(placedElement.tagName).to.equal('PowerTransformer');
            expect(placedElement.children.length).to.equal(2);
        });
        it('creates three winding transformer when clicked', async () => {
            const doc = new DOMParser().parseFromString(docWithSubstation, 'application/xml');
            element.doc = doc;
            await element.updateComplete;
            const placingSpy = spy(element, 'startPlacing');
            const button = element.shadowRoot?.querySelector('mwc-fab[label="Add Three Winding Transformer"]');
            button.click();
            await element.updateComplete;
            expect(placingSpy.calledOnce).to.be.true;
            const placedElement = placingSpy.firstCall.args[0];
            expect(placedElement.tagName).to.equal('PowerTransformer');
            expect(placedElement.children.length).to.equal(3);
        });
    });
    describe('zoom controls', () => {
        it('are hidden when no substation exists', async () => {
            const doc = new DOMParser().parseFromString(emptyDoc, 'application/xml');
            element.doc = doc;
            await element.updateComplete;
            const zoomIn = element.shadowRoot?.querySelector('mwc-icon-button[icon="zoom_in"]');
            const zoomOut = element.shadowRoot?.querySelector('mwc-icon-button[icon="zoom_out"]');
            expect(zoomIn).to.not.exist;
            expect(zoomOut).to.not.exist;
        });
        it('are visible when substation exists', async () => {
            const doc = new DOMParser().parseFromString(docWithSubstation, 'application/xml');
            element.doc = doc;
            await element.updateComplete;
            const zoomIn = element.shadowRoot?.querySelector('mwc-icon-button[icon="zoom_in"]');
            const zoomOut = element.shadowRoot?.querySelector('mwc-icon-button[icon="zoom_out"]');
            expect(zoomIn).to.exist;
            expect(zoomOut).to.exist;
        });
        it('increases gridSize when zoom in is clicked', async () => {
            const doc = new DOMParser().parseFromString(docWithSubstation, 'application/xml');
            element.doc = doc;
            await element.updateComplete;
            const initialSize = element.gridSize;
            const button = element.shadowRoot?.querySelector('mwc-icon-button[icon="zoom_in"]');
            button.click();
            await element.updateComplete;
            expect(element.gridSize).to.equal(initialSize + 3);
        });
        it('decreases gridSize when zoom out is clicked', async () => {
            const doc = new DOMParser().parseFromString(docWithSubstation, 'application/xml');
            element.doc = doc;
            await element.updateComplete;
            const initialSize = element.gridSize;
            const button = element.shadowRoot?.querySelector('mwc-icon-button[icon="zoom_out"]');
            button.click();
            await element.updateComplete;
            expect(element.gridSize).to.equal(initialSize - 3);
        });
        it('does not zoom below minimum gridSize', async () => {
            const doc = new DOMParser().parseFromString(docWithSubstation, 'application/xml');
            element.doc = doc;
            element.gridSize = 2;
            await element.updateComplete;
            element.zoomOut();
            expect(element.gridSize).to.equal(2);
        });
    });
    describe('label toggle', () => {
        it('is hidden when no voltage level or transformer exists', async () => {
            const doc = new DOMParser().parseFromString(docWithSubstation, 'application/xml');
            element.doc = doc;
            await element.updateComplete;
            const toggle = element.shadowRoot?.querySelector('#labels');
            expect(toggle).to.not.exist;
        });
        it('is visible when voltage level exists', async () => {
            const doc = new DOMParser().parseFromString(docWithVoltageLevel, 'application/xml');
            element.doc = doc;
            await element.updateComplete;
            const toggle = element.shadowRoot?.querySelector('#labels');
            expect(toggle).to.exist;
        });
    });
    describe('startPlacing method', () => {
        it('resets state before starting placement', async () => {
            const doc = new DOMParser().parseFromString(docWithBay, 'application/xml');
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
            const doc = new DOMParser().parseFromString(docWithBay, 'application/xml');
            element.doc = doc;
            await element.updateComplete;
            const bay = doc.querySelector('Bay');
            const newEquipment = doc.createElementNS(doc.documentElement.namespaceURI, 'ConductingEquipment');
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
            const doc = new DOMParser().parseFromString(docWithBay, 'application/xml');
            element.doc = doc;
            await element.updateComplete;
            const bay = doc.querySelector('Bay');
            const newEquipment = doc.createElementNS(doc.documentElement.namespaceURI, 'ConductingEquipment');
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
            const doc = new DOMParser().parseFromString(docWithBay, 'application/xml');
            element.doc = doc;
            await element.updateComplete;
            const testElement = doc.createElementNS(doc.documentElement.namespaceURI, 'Bay');
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
            const sldAttrs = testElement.querySelector('Private[type="OpenSCD-SLD-Layout"] > SLDAttributes');
            expect(sldAttrs).to.exist;
        });
    });
});
//# sourceMappingURL=bay-template-editor.spec.js.map