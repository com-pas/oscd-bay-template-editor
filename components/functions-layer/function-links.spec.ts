/* eslint-disable no-unused-expressions */
import { expect } from '@open-wc/testing';
import { isSourceFunction, isSinkFunction } from './function-links.js';
import { docWithSourceRef } from '../../testfiles.js';

describe('function-links', () => {
  let doc: XMLDocument;
  beforeEach(() => {
    doc = new DOMParser().parseFromString(docWithSourceRef, 'application/xml');
  });

  describe('isSourceFunction', () => {
    it('should return true for source functions', () => {
      const lNode = doc.querySelector('LNode[lnClass="LLN0"]');
      expect(isSourceFunction(lNode!)).to.be.true;
    });
    it('should return false for non-source functions', () => {
      const lNode = doc.querySelector('LNode[lnClass="CSWI"]');
      expect(isSourceFunction(lNode!)).to.be.false;
    });
  });

  describe('isSinkFunction', () => {
    it('should return true for sink functions', () => {
      const lNodeWithSourceRef = doc.querySelector('LNode[lnClass="CSWI"]');
      expect(isSinkFunction(lNodeWithSourceRef!)).to.be.true;
    });

    it('should return false for non-sink functions', () => {
      const lNodeWithSubFunction = doc.querySelector('LNode[lnClass="TCTR"]');
      expect(isSinkFunction(lNodeWithSubFunction!)).to.be.false;
    });
  });
});
