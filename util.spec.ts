import { expect } from '@open-wc/testing';

import {
  getFunctionCoordinates,
  setSLDAttributes,
  getSLDAttributes,
  uniqueName,
  isBusBar,
  makeBusBar,
  privType,
  eTr6100PrivType,
  sldNs,
  getProcessPath,
  createPowerSystemRelationPrivate,
  getFunctions,
  getSldSvgs,
  highlightBusbars,
  clearBusbarHighlights,
  createLNodeFromType,
  uniqueLNodeTypes,
} from './util.js';

import { docWithBayAndFunctions, lnodeTypeLibrary } from './util-testfiles.js';

describe('utils', () => {
  let doc: XMLDocument;
  beforeEach(() => {
    doc = new DOMParser().parseFromString(
      docWithBayAndFunctions,
      'application/xml'
    );
  });

  describe('getFunctionCoordinates', () => {
    it('returns top left +1 for Bay parent', () => {
      const bay = doc.querySelector('Bay[name="B1"]');
      const coords = getFunctionCoordinates(doc, bay!);
      expect(coords.x).equal(6);
      expect(coords.y).equal(6);
    });

    it('places below parent with coordinates', () => {
      const parent = doc.createElement('ConductingEquipment');
      setSLDAttributes(parent, 'eosld', { x: '10', y: '20' });
      doc.documentElement.firstElementChild!.appendChild(parent);
      const coords = getFunctionCoordinates(doc, parent);
      expect(coords.x).equal(11);
      expect(coords.y).equal(21);
    });

    it('places below child with coordinates if parent has none', () => {
      const parent = doc.createElement('ConductingEquipment');
      const child = doc.createElement('Function');
      setSLDAttributes(child, 'eosld', { x: '5', y: '7' });
      parent.appendChild(child);
      doc.documentElement.firstElementChild!.appendChild(parent);
      const coords = getFunctionCoordinates(doc, parent);
      expect(coords.x).equal(5);
      expect(coords.y).equal(9);
    });

    it('avoids stacking by offsetting', () => {
      const parent = doc.createElement('ConductingEquipment');
      setSLDAttributes(parent, 'eosld', { x: '1', y: '9' });
      doc.documentElement.firstElementChild!.appendChild(parent);
      const fn1 = doc.createElement('Function');
      setSLDAttributes(fn1, 'eosld', { x: '2', y: '10' });
      doc.documentElement.appendChild(fn1);
      const fn2 = doc.createElement('Function');
      setSLDAttributes(fn2, 'eosld', { x: '3', y: '11' });
      doc.documentElement.appendChild(fn2);
      // Next function should avoid (1,9) (2,10) (3,11)
      const coords = getFunctionCoordinates(doc, parent);
      expect(coords.x).not.equal(1);
      expect(coords.y).not.equal(9);
      expect(coords.x).not.equal(2);
      expect(coords.y).not.equal(10);
      expect(coords.x).not.equal(3);
      expect(coords.y).not.equal(11);
      expect(coords.x).equal(4);
      expect(coords.y).equal(12);
    });
  });

  describe('setSLDAttributes & getSLDAttributes', () => {
    it('sets and gets attributes for Section/Vertex', () => {
      const section = doc.createElement('Section');
      setSLDAttributes(section, 'eosld', { x: '5', y: '6' });
      expect(getSLDAttributes(section, 'x')).equal('5');
      expect(getSLDAttributes(section, 'y')).equal('6');
    });

    it('sets and gets attributes for other elements', () => {
      const eq = doc.createElement('ConductingEquipment');
      setSLDAttributes(eq, 'eosld', { x: '7', y: '8' });
      expect(getSLDAttributes(eq, 'x')).equal('7');
      expect(getSLDAttributes(eq, 'y')).equal('8');
    });
  });

  describe('uniqueName', () => {
    it('returns existing unique name', () => {
      const parent = doc.createElement('Bay');
      const child = doc.createElement('Function');
      parent.appendChild(child);
      expect(uniqueName(child, parent)).equal('F1');
    });

    it('generates new name if duplicate', () => {
      const parent = doc.createElement('Bay');
      const child1 = doc.createElement('Function');
      child1.setAttribute('name', 'F1');
      parent.appendChild(child1);
      const child2 = doc.createElement('Function');
      child2.setAttribute('name', 'F1');
      parent.appendChild(child2);
      expect(uniqueName(child2, parent)).match(/^F\d+$/);
      expect(uniqueName(child2, parent)).not.equal('F1');
    });
  });

  describe('isBusBar', () => {
    it('returns true for Bay with bus section', () => {
      const bay = doc.createElement('Bay');
      const priv = doc.createElement('Private');
      priv.setAttribute('type', privType);
      const section = doc.createElementNS(sldNs, 'eosld:Section');
      setSLDAttributes(section, 'eosld', { bus: 'true' });
      priv.appendChild(section);
      bay.appendChild(priv);
      expect(isBusBar(bay)).equal(true);
    });

    it('returns false for Bay without bus section', () => {
      const bay = doc.createElement('Bay');
      expect(isBusBar(bay)).equal(false);
    });
  });

  describe('makeBusBar', () => {
    it('creates a Bay element with bus section and vertices', () => {
      const busBar = makeBusBar(doc, 'eosld');
      expect(busBar.tagName).equal('Bay');
      expect(busBar.getAttribute('name')).equal('BB1');
      const cNode = busBar.querySelector('ConnectivityNode');
      expect(cNode).not.equal(null);
      const priv = cNode!.querySelector('Private');
      expect(priv).not.equal(null);
      const section = priv!.querySelector('Section');
      expect(section).not.equal(null);
      expect(getSLDAttributes(section!, 'bus')).equal('true');
      const vertices = section!.querySelectorAll('Vertex');
      expect(vertices.length).equal(2);
      expect(getSLDAttributes(vertices[0], 'x')).equal('0.5');
      expect(getSLDAttributes(vertices[1], 'x')).equal('1.5');
    });
  });

  describe('getProcessPath', () => {
    it('returns path of element in document', () => {
      const element = doc.querySelector('ConductingEquipment[name="CAB1"]')!;
      const path = getProcessPath(element);
      expect(path).equal('S1/V1/B1/CAB1');
    });
  });

  describe('createPowerSystemRelationPrivate', () => {
    it('creates Private element with correct type and path', () => {
      const element = doc.querySelector('ConductingEquipment[name="CAB1"]')!;
      const path = getProcessPath(element);
      const priv = createPowerSystemRelationPrivate(doc, path);
      expect(priv.tagName).equal('Private');
      expect(priv.getAttribute('type')).equal(eTr6100PrivType);
      const psrElement1 = priv.querySelector('PowerSystemRelations')!;
      const psrElement2 = psrElement1.querySelector('PowerSystemRelation')!;

      expect(psrElement2).not.equal(null);
      expect(psrElement2!.getAttribute('relation')).equal(path);
    });
  });

  describe('getFunctions', () => {
    it('returns all Function elements related to a Bay', () => {
      const bay = doc.querySelector('Bay[name="B1"]')!;
      const functions = getFunctions(bay);
      expect(functions.length).equal(2);
      const names = functions.map(fn => fn.getAttribute('name'));
      expect(names).to.include.members(['F1', 'F2']);
    });
    it('returns all Function elements related to a VoltageLevel', () => {
      const voltageLevel = doc.querySelector('VoltageLevel[name="V1"]')!;
      const functions = getFunctions(voltageLevel);
      expect(functions.length).equal(1);
      const names = functions.map(fn => fn.getAttribute('name'));
      expect(names).to.include.members(['F3']);
    });
    it('returns all EqFunction elments related to ConductingEquipment', () => {
      const ce = doc.querySelector('ConductingEquipment[name="CAB1"]')!;
      const functions = getFunctions(ce);
      expect(functions.length).equal(1);
      expect(functions[0].tagName).equal('EqFunction');
      const names = functions.map(fn => fn.getAttribute('name'));
      expect(names).to.include.members(['CABFunction']);
    });
    it('returns all EqFunction elements related to PowerTransformer', () => {
      const ptr = doc.querySelector('PowerTransformer[name="PTR1"]')!;
      const functions = getFunctions(ptr);
      expect(functions[0].tagName).equal('EqFunction');
      const names = functions.map(f => f.getAttribute('name'));
      expect(names).to.include('PTRFunction');
    });
  });

  describe('busbar highlighting', () => {
    let sldEditor: HTMLElement;
    let svg: SVGSVGElement;
    let busbar: Element;

    beforeEach(() => {
      sldEditor = document.createElement('div');
      const shadowRoot = sldEditor.attachShadow({ mode: 'open' });

      const substationEditor = document.createElement('sld-substation-editor');
      const substationShadow = substationEditor.attachShadow({ mode: 'open' });

      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('id', 'sld');

      const busbarGroup = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'g'
      );
      busbarGroup.setAttribute('data-name', 'BB1');

      const line1 = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'line'
      ) as any;
      line1.setAttribute('x1', '0');
      line1.setAttribute('y1', '10');
      line1.setAttribute('x2', '50');
      line1.setAttribute('y2', '10');
      line1.getBBox = () => ({ x: 0, y: 10, width: 50, height: 0 });
      busbarGroup.appendChild(line1);

      const line2 = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'line'
      ) as any;
      line2.setAttribute('x1', '50');
      line2.setAttribute('y1', '10');
      line2.setAttribute('x2', '100');
      line2.setAttribute('y2', '10');
      line2.getBBox = () => ({ x: 50, y: 10, width: 50, height: 0 });
      busbarGroup.appendChild(line2);

      svg.appendChild(busbarGroup);
      substationShadow.appendChild(svg);
      shadowRoot.appendChild(substationEditor);

      busbar = makeBusBar(doc, 'eosld');
      busbar.setAttribute('name', 'BB1');
    });

    describe('getSldSvgs', () => {
      it('returns SVG elements from shadow DOM', () => {
        const svgs = getSldSvgs(sldEditor);
        expect(svgs.length).equal(1);
        expect(svgs[0].tagName).equal('svg');
        expect(svgs[0].getAttribute('id')).equal('sld');
      });

      it('returns empty array if no shadow root', () => {
        const plainElement = document.createElement('div');
        const svgs = getSldSvgs(plainElement);
        expect(svgs.length).equal(0);
      });

      it('handles multiple substation editors', () => {
        const shadowRoot = sldEditor.shadowRoot!;

        const substationEditor2 = document.createElement(
          'sld-substation-editor'
        );
        const substationShadow2 = substationEditor2.attachShadow({
          mode: 'open',
        });
        const svg2 = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'svg'
        );
        svg2.setAttribute('id', 'sld');
        substationShadow2.appendChild(svg2);
        shadowRoot.appendChild(substationEditor2);

        const svgs = getSldSvgs(sldEditor);
        expect(svgs.length).equal(2);
      });
    });

    describe('highlightBusbars', () => {
      it('creates highlight rectangle for busbar', () => {
        const highlightStyle = {
          stroke: '#9333ea',
          strokeWidth: 0.2,
          fill: 'rgba(216,180,254,0.3)',
          opacity: 1,
        };

        highlightBusbars(sldEditor, [busbar], highlightStyle);

        const highlightRect = svg.querySelector('.busbar-highlight-workaround');
        expect(highlightRect).not.equal(null);
        expect(highlightRect!.tagName).equal('rect');
        expect(highlightRect!.getAttribute('fill')).equal(
          'rgba(216,180,254,0.3)'
        );
        expect(highlightRect!.getAttribute('stroke')).equal('#9333ea');
      });

      it('does nothing when busbars array is empty', () => {
        const highlightStyle = {
          stroke: '#9333ea',
          strokeWidth: 0.2,
          fill: 'rgba(216,180,254,0.3)',
        };

        highlightBusbars(sldEditor, [], highlightStyle);

        const highlightRect = svg.querySelector('.busbar-highlight-workaround');
        expect(highlightRect).equal(null);
      });

      it('creates multiple highlights for multiple busbars', () => {
        const busbar2 = makeBusBar(doc, 'eosld');
        busbar2.setAttribute('name', 'BB2');

        const busbarGroup2 = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'g'
        );
        busbarGroup2.setAttribute('data-name', 'BB2');
        const line = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'line'
        ) as any;
        line.setAttribute('x1', '0');
        line.setAttribute('y1', '20');
        line.setAttribute('x2', '100');
        line.setAttribute('y2', '20');
        line.getBBox = () => ({ x: 0, y: 20, width: 100, height: 0 });
        busbarGroup2.appendChild(line);
        svg.appendChild(busbarGroup2);

        const highlightStyle = {
          stroke: '#9333ea',
          strokeWidth: 0.2,
          fill: 'rgba(216,180,254,0.3)',
        };

        highlightBusbars(sldEditor, [busbar, busbar2], highlightStyle);

        const highlights = svg.querySelectorAll('.busbar-highlight-workaround');
        expect(highlights.length).equal(2);
      });

      it('makes highlight rectangles clickable', () => {
        const highlightStyle = {
          stroke: '#9333ea',
          strokeWidth: 0.2,
          fill: 'rgba(216,180,254,0.3)',
        };

        highlightBusbars(sldEditor, [busbar], highlightStyle);

        const highlightRect = svg.querySelector(
          '.busbar-highlight-workaround'
        ) as SVGRectElement;
        expect(highlightRect!.getAttribute('pointer-events')).equal('all');
      });

      it('handles busbar without name gracefully', () => {
        const busbarNoName = makeBusBar(doc, 'eosld');
        busbarNoName.removeAttribute('name');

        const highlightStyle = {
          stroke: '#9333ea',
          strokeWidth: 0.2,
          fill: 'rgba(216,180,254,0.3)',
        };

        highlightBusbars(sldEditor, [busbarNoName], highlightStyle);

        const highlightRect = svg.querySelector('.busbar-highlight-workaround');
        expect(highlightRect).equal(null);
      });
    });

    describe('clearBusbarHighlights', () => {
      it('removes all busbar highlights', () => {
        const highlightStyle = {
          stroke: '#9333ea',
          strokeWidth: 0.2,
          fill: 'rgba(216,180,254,0.3)',
        };

        highlightBusbars(sldEditor, [busbar], highlightStyle);

        let highlightRect = svg.querySelector('.busbar-highlight-workaround');
        expect(highlightRect).not.equal(null);

        clearBusbarHighlights(sldEditor);

        highlightRect = svg.querySelector('.busbar-highlight-workaround');
        expect(highlightRect).equal(null);
      });

      it('removes multiple highlights', () => {
        const busbar2 = makeBusBar(doc, 'eosld');
        busbar2.setAttribute('name', 'BB2');

        const busbarGroup2 = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'g'
        );
        busbarGroup2.setAttribute('data-name', 'BB2');
        const line = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'line'
        ) as any;
        line.setAttribute('x1', '0');
        line.setAttribute('y1', '20');
        line.setAttribute('x2', '100');
        line.setAttribute('y2', '20');
        line.getBBox = () => ({ x: 0, y: 20, width: 100, height: 0 });
        busbarGroup2.appendChild(line);
        svg.appendChild(busbarGroup2);

        const highlightStyle = {
          stroke: '#9333ea',
          strokeWidth: 0.2,
          fill: 'rgba(216,180,254,0.3)',
        };

        highlightBusbars(sldEditor, [busbar, busbar2], highlightStyle);

        let highlights = svg.querySelectorAll('.busbar-highlight-workaround');
        expect(highlights.length).equal(2);

        clearBusbarHighlights(sldEditor);

        highlights = svg.querySelectorAll('.busbar-highlight-workaround');
        expect(highlights.length).equal(0);
      });

      it('does nothing if no highlights exist', () => {
        clearBusbarHighlights(sldEditor);

        const highlights = svg.querySelectorAll('.busbar-highlight-workaround');
        expect(highlights.length).equal(0);
      });
    });

    describe('createLNodeFromType', () => {
      beforeEach(() => {
        doc = new DOMParser().parseFromString(
          lnodeTypeLibrary,
          'application/xml'
        );
      });
      it('creates a new LNode element from an LNodeType', () => {
        const lNodeType = doc.querySelector('LNodeType[lnClass="TVTR"]')!;
        const newLNode = createLNodeFromType(doc, lNodeType);
        expect(newLNode.tagName).equal('LNode');
        expect(newLNode.getAttribute('lnClass')).equal('TVTR');
        expect(newLNode.getAttribute('iedName')).to.equal(null);
        expect(newLNode.getAttribute('ldInst')).to.equal(null);
        expect(newLNode.getAttribute('prefix')).to.equal(null);
        expect(newLNode.getAttribute('lnInst')).to.equal(null);
      });
    });

    describe('uniqueLNodeTypes', () => {
      function createLNodeType(id: string, lnClass: string): Element {
        const lNodeType = doc.createElement('LNodeType');
        lNodeType.setAttribute('id', id);
        lNodeType.setAttribute('lnClass', lnClass);
        return lNodeType;
      }
      it('returns unique LNode types', () => {
        const lNodeTypes = [
          createLNodeType('1', 'TVTR'),
          createLNodeType('2', 'TVTR'),
          createLNodeType('1', 'TVTR'),
        ];
        const uniqueTypes = uniqueLNodeTypes(lNodeTypes);
        const ids = uniqueTypes.map(type => type.getAttribute('id'));
        expect(ids).to.have.lengthOf(2);
      });
    });
  });
});
