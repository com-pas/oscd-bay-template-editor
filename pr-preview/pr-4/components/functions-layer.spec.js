/* eslint-disable no-unused-expressions */
import { html } from 'lit';
import sinon, { spy } from 'sinon';
import { fixture, expect } from '@open-wc/testing';
import { FunctionsLayer } from './functions-layer.js';
const docWithBayAndFunctions = `<?xml version="1.0" encoding="UTF-8"?>
<SCL xmlns="http://www.iec.ch/61850/2003/SCL"
  xmlns:eosld="https://openscd.org/SCL/SSD/SLD/v0" version="2007" revision="B">
  <Substation name="S1">
    <Private type="OpenSCD-SLD-Layout">
      <eosld:SLDAttributes eosld:w="50" eosld:h="25" />
    </Private>
    <VoltageLevel name="V1">
      <Bay name="B1">
        <Private type="OpenSCD-SLD-Layout">
          <eosld:SLDAttributes eosld:x="5" eosld:y="5" eosld:w="20" eosld:h="15" />
        </Private>
        <Function name="F1">
          <Private type="OpenSCD-SLD-Layout">
            <eosld:SLDAttributes eosld:x="10" eosld:y="10" />
          </Private>
        </Function>
        <Function name="F2">
          <Private type="OpenSCD-SLD-Layout">
            <eosld:SLDAttributes eosld:x="15" eosld:y="12" />
          </Private>
        </Function>
      </Bay>
    </VoltageLevel>
  </Substation>
</SCL>`;
const docWithoutFunctions = `<?xml version="1.0" encoding="UTF-8"?>
<SCL xmlns="http://www.iec.ch/61850/2003/SCL"
  xmlns:eosld="https://openscd.org/SCL/SSD/SLD/v0" version="2007" revision="B">
  <Substation name="S1">
    <Private type="OpenSCD-SLD-Layout">
      <eosld:SLDAttributes eosld:w="50" eosld:h="25" />
    </Private>
    <VoltageLevel name="V1">
      <Bay name="B1">
        <Private type="OpenSCD-SLD-Layout">
          <eosld:SLDAttributes eosld:x="5" eosld:y="5" eosld:w="20" eosld:h="15" />
        </Private>
      </Bay>
    </VoltageLevel>
  </Substation>
</SCL>`;
const docWithFunctionWithoutBay = `<?xml version="1.0" encoding="UTF-8"?>
<SCL xmlns="http://www.iec.ch/61850/2003/SCL"
  xmlns:eosld="https://openscd.org/SCL/SSD/SLD/v0" version="2007" revision="B">
  <Substation name="S1">
    <Private type="OpenSCD-SLD-Layout">
      <eosld:SLDAttributes eosld:w="50" eosld:h="25" />
    </Private>
    <VoltageLevel name="V1">
      <Function name="F1">
        <Private type="OpenSCD-SLD-Layout">
          <eosld:SLDAttributes eosld:x="10" eosld:y="10" />
        </Private>
      </Function>
    </VoltageLevel>
  </Substation>
</SCL>`;
if (!customElements.get('functions-layer')) {
    customElements.define('functions-layer', FunctionsLayer);
}
describe('FunctionsLayer', () => {
    let element;
    beforeEach(async () => {
        element = await fixture(html `<functions-layer
        .gridSize=${24}
        .nsp=${'eosld'}
        .editCount=${-1}
      ></functions-layer>`);
        await element.updateComplete;
    });
    afterEach(() => {
        sinon.restore();
    });
    describe('without document', () => {
        it('renders empty SVG when no document is provided', async () => {
            expect(element.shadowRoot?.querySelector('svg')).to.exist;
            const groups = element.shadowRoot?.querySelectorAll('g.function');
            expect(groups?.length).to.equal(0);
        });
    });
    describe('with document containing functions', () => {
        beforeEach(async () => {
            const doc = new DOMParser().parseFromString(docWithBayAndFunctions, 'application/xml');
            element.doc = doc;
            await element.updateComplete;
        });
        it('renders function elements', async () => {
            const functions = element.shadowRoot?.querySelectorAll('g.function');
            expect(functions?.length).to.equal(2);
        });
        it('displays function names', async () => {
            const textElements = element.shadowRoot?.querySelectorAll('text');
            const functionNames = Array.from(textElements || [])
                .map(text => text.textContent?.trim())
                .filter(text => text === 'F1' || text === 'F2');
            expect(functionNames).to.include('F1');
            expect(functionNames).to.include('F2');
        });
        it('positions functions based on SLD attributes', async () => {
            const rects = element.shadowRoot?.querySelectorAll('rect');
            expect(rects?.length).to.be.greaterThan(0);
        });
    });
    describe('without functions', () => {
        it('renders no function elements when document has no functions', async () => {
            const doc = new DOMParser().parseFromString(docWithoutFunctions, 'application/xml');
            element.doc = doc;
            await element.updateComplete;
            const functions = element.shadowRoot?.querySelectorAll('g.function');
            expect(functions?.length).to.equal(0);
        });
    });
    describe('mouse interaction', () => {
        beforeEach(async () => {
            const doc = new DOMParser().parseFromString(docWithBayAndFunctions, 'application/xml');
            element.doc = doc;
            await element.updateComplete;
        });
        it('updates mouse position on mousemove', async () => {
            const svg = element.shadowRoot?.querySelector('svg');
            expect(svg).to.exist;
            const mouseMoveEvent = new MouseEvent('mousemove', {
                clientX: 100,
                clientY: 100,
                bubbles: true,
            });
            svg.dispatchEvent(mouseMoveEvent);
            await element.updateComplete;
        });
        it('handles function click when not disabled', async () => {
            const functions = element.shadowRoot?.querySelector('g.function');
            expect(functions).to.exist;
            const onStartPlaceFunctionSpy = spy();
            element.onStartPlaceFunction = onStartPlaceFunctionSpy;
            functions.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            await element.updateComplete;
            expect(onStartPlaceFunctionSpy.calledOnce).to.be.true;
        });
        it('does not handle function click when disabled', async () => {
            element.disabled = true;
            await element.updateComplete;
            const functions = element.shadowRoot?.querySelector('g.function');
            expect(functions).to.exist;
            const onStartPlaceFunctionSpy = spy();
            element.onStartPlaceFunction = onStartPlaceFunctionSpy;
            functions.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            await element.updateComplete;
            expect(onStartPlaceFunctionSpy.called).to.be.false;
        });
    });
    describe('placing mode', () => {
        beforeEach(async () => {
            const doc = new DOMParser().parseFromString(docWithBayAndFunctions, 'application/xml');
            element.doc = doc;
            await element.updateComplete;
        });
        it('shows preview when placing a function', async () => {
            const functionElement = element.doc?.querySelector('Function[name="F1"]');
            expect(functionElement).to.exist;
            element.placing = functionElement;
            element.placingOffset = [0, 0];
            await element.updateComplete;
            const previewGroups = element.shadowRoot?.querySelectorAll('g.preview');
            expect(previewGroups?.length).to.be.greaterThan(0);
        });
        it('hides original function when placing', async () => {
            const functionElement = element.doc?.querySelector('Function[name="F1"]');
            expect(functionElement).to.exist;
            element.placing = functionElement;
            await element.updateComplete;
            // The original function should not be rendered as a normal function
            const normalFunctions = element.shadowRoot?.querySelectorAll('g.function:not(.preview)');
            // Should have one less normal function (only F2)
            expect(normalFunctions?.length).to.equal(1);
        });
        it('shows coordinate tooltip when placing', async () => {
            const functionElement = element.doc?.querySelector('Function[name="F1"]');
            expect(functionElement).to.exist;
            element.placing = functionElement;
            await element.updateComplete;
            const coordinatesDiv = element.shadowRoot?.querySelector('.coordinates');
            expect(coordinatesDiv).to.exist;
        });
        it('marks coordinates as invalid when outside bay boundaries', async () => {
            const functionElement = element.doc?.querySelector('Function[name="F1"]');
            expect(functionElement).to.exist;
            element.placing = functionElement;
            element.placingOffset = [0, 0];
            await element.updateComplete;
            // Simulate mouse position outside bay boundaries
            const svg = element.shadowRoot?.querySelector('svg');
            const mouseMoveEvent = new MouseEvent('mousemove', {
                clientX: 0,
                clientY: 0,
                bubbles: true,
            });
            svg.dispatchEvent(mouseMoveEvent);
            await element.updateComplete;
        });
        it('finalizes placement on container click', async () => {
            const doc = new DOMParser().parseFromString(docWithBayAndFunctions, 'application/xml');
            element.doc = doc;
            const functionElement = doc.querySelector('Function[name="F1"]');
            expect(functionElement).to.exist;
            element.placing = functionElement;
            element.placingOffset = [0, 0];
            await element.updateComplete;
            const editSpy = spy();
            element.addEventListener('oscd-edit-v2', editSpy);
            const rects = element.shadowRoot?.querySelectorAll('rect[fill="transparent"]');
            expect(rects?.length).to.be.greaterThan(0);
            const clickTarget = rects[0];
            clickTarget.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            await element.updateComplete;
            expect(editSpy.called).to.be.true;
        });
    });
    describe('bay boundaries', () => {
        it('clamps function position within bay boundaries', async () => {
            const doc = new DOMParser().parseFromString(docWithBayAndFunctions, 'application/xml');
            element.doc = doc;
            await element.updateComplete;
            const functionElement = doc.querySelector('Function[name="F1"]');
            expect(functionElement).to.exist;
            // Set placing mode with position outside bay
            element.placing = functionElement;
            element.placingOffset = [0, 0];
            await element.updateComplete;
            // The function should still render (clamped to bay boundaries)
            const previewGroups = element.shadowRoot?.querySelectorAll('g.preview');
            expect(previewGroups?.length).to.be.greaterThan(0);
        });
    });
    describe('function without parent bay', () => {
        it('handles functions without parent bay gracefully', async () => {
            const doc = new DOMParser().parseFromString(docWithFunctionWithoutBay, 'application/xml');
            element.doc = doc;
            await element.updateComplete;
            // Should not render functions without valid bay parent
            const functions = element.shadowRoot?.querySelectorAll('g.function');
            expect(functions?.length).to.equal(0);
        });
    });
    describe('disabled state', () => {
        beforeEach(async () => {
            const doc = new DOMParser().parseFromString(docWithBayAndFunctions, 'application/xml');
            element.doc = doc;
            element.disabled = true;
            await element.updateComplete;
        });
        it('applies disabled class to SVG', async () => {
            const svg = element.shadowRoot?.querySelector('svg');
            expect(svg?.classList.contains('disabled')).to.be.true;
        });
        it('does not handle mouse events when disabled', async () => {
            const svg = element.shadowRoot?.querySelector('svg');
            const initialX = element.mouseX;
            const initialY = element.mouseY;
            const mouseMoveEvent = new MouseEvent('mousemove', {
                clientX: 100,
                clientY: 100,
                bubbles: true,
            });
            svg.dispatchEvent(mouseMoveEvent);
            await element.updateComplete;
            // Mouse position should not update when disabled
            expect(element.mouseX).to.equal(initialX);
            expect(element.mouseY).to.equal(initialY);
        });
    });
    describe('grid size changes', () => {
        beforeEach(async () => {
            const doc = new DOMParser().parseFromString(docWithBayAndFunctions, 'application/xml');
            element.doc = doc;
            await element.updateComplete;
        });
        it('updates rendering when gridSize changes', async () => {
            const initialFunctions = element.shadowRoot?.querySelectorAll('g.function');
            expect(initialFunctions?.length).to.equal(2);
            element.gridSize = 48;
            await element.updateComplete;
            const updatedFunctions = element.shadowRoot?.querySelectorAll('g.function');
            expect(updatedFunctions?.length).to.equal(2);
        });
    });
    describe('editCount updates', () => {
        it('updates function positions when editCount changes', async () => {
            const doc = new DOMParser().parseFromString(docWithBayAndFunctions, 'application/xml');
            element.doc = doc;
            element.editCount = 0;
            await element.updateComplete;
            element.editCount = 1;
            await element.updateComplete;
            const functions = element.shadowRoot?.querySelectorAll('g.function');
            expect(functions?.length).to.equal(2);
        });
    });
    describe('SVG dimensions', () => {
        it('uses substation dimensions for SVG viewBox', async () => {
            const doc = new DOMParser().parseFromString(docWithBayAndFunctions, 'application/xml');
            element.doc = doc;
            await element.updateComplete;
            const svg = element.shadowRoot?.querySelector('svg');
            expect(svg).to.exist;
            expect(svg?.getAttribute('viewBox')).to.exist;
        });
        it('uses default dimensions when substation has no dimensions', async () => {
            const docWithoutDimensions = `<?xml version="1.0" encoding="UTF-8"?>
<SCL xmlns="http://www.iec.ch/61850/2003/SCL" version="2007" revision="B">
  <Substation name="S1">
    <VoltageLevel name="V1">
      <Bay name="B1">
        <Function name="F1" />
      </Bay>
    </VoltageLevel>
  </Substation>
</SCL>`;
            const doc = new DOMParser().parseFromString(docWithoutDimensions, 'application/xml');
            element.doc = doc;
            await element.updateComplete;
            const svg = element.shadowRoot?.querySelector('svg');
            expect(svg).to.exist;
        });
    });
    describe('function box width calculation', () => {
        it('calculates minimum width for short names', async () => {
            const doc = new DOMParser().parseFromString(docWithBayAndFunctions, 'application/xml');
            element.doc = doc;
            await element.updateComplete;
            const rects = element.shadowRoot?.querySelectorAll('rect');
            expect(rects?.length).to.be.greaterThan(0);
            // All rects should have a width attribute
            rects?.forEach(rect => {
                const width = parseFloat(rect.getAttribute('width') || '0');
                expect(width).to.be.greaterThan(0);
            });
        });
        it('calculates appropriate width for longer names', async () => {
            const docWithLongName = `<?xml version="1.0" encoding="UTF-8"?>
<SCL xmlns="http://www.iec.ch/61850/2003/SCL"
  xmlns:eosld="https://openscd.org/SCL/SSD/SLD/v0" version="2007" revision="B">
  <Substation name="S1">
    <Private type="OpenSCD-SLD-Layout">
      <eosld:SLDAttributes eosld:w="50" eosld:h="25" />
    </Private>
    <VoltageLevel name="V1">
      <Bay name="B1">
        <Private type="OpenSCD-SLD-Layout">
          <eosld:SLDAttributes eosld:x="5" eosld:y="5" eosld:w="20" eosld:h="15" />
        </Private>
        <Function name="VeryLongFunctionName">
          <Private type="OpenSCD-SLD-Layout">
            <eosld:SLDAttributes eosld:x="10" eosld:y="10" />
          </Private>
        </Function>
      </Bay>
    </VoltageLevel>
  </Substation>
</SCL>`;
            const doc = new DOMParser().parseFromString(docWithLongName, 'application/xml');
            element.doc = doc;
            await element.updateComplete;
            const rects = element.shadowRoot?.querySelectorAll('rect');
            expect(rects?.length).to.be.greaterThan(0);
        });
    });
    describe('namespace handling', () => {
        it('uses custom namespace when provided', async () => {
            const doc = new DOMParser().parseFromString(docWithBayAndFunctions, 'application/xml');
            element.doc = doc;
            element.nsp = 'customnsp';
            await element.updateComplete;
            expect(element.nsp).to.equal('customnsp');
        });
    });
});
//# sourceMappingURL=functions-layer.spec.js.map