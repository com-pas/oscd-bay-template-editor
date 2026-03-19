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
} from './util.js';

import { docWithBayAndFunctions } from './util-testfiles.js';

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
    it('returns all Function elments related to ConductingEquipment', () => {
      const ce = doc.querySelector('ConductingEquipment[name="CAB1"]')!;
      const functions = getFunctions(ce);
      expect(functions.length).equal(1);
      const names = functions.map(fn => fn.getAttribute('name'));
      expect(names).to.include.members(['CABFunction']);
    });
  });
});
