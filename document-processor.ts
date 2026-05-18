import { getSLDAttributes, eTr6100Ns, isBusBar } from './util.js';

export interface ProcessedFunction {
  element: Element;
  name: string;
  x: number;
  y: number;
  parent: Element | null;
  referencedElement: Element | null;
  relationPath: string | null;
}

export interface ProcessedDocument {
  substations: Element[];
  functionMap: Map<Element, ProcessedFunction[]>;
  functionsByElement: Map<Element, ProcessedFunction>;
  allFunctions: ProcessedFunction[];
  psrElements: Element[];
  hasVoltageLevelOrTransformer: boolean;
  hasFunctions: boolean;
  hasSubstation: boolean;
  hasNonBusBarBays: boolean;
  hasVoltageLevel: boolean;
}

export class DocumentProcessor {
  /**
   * Processes an XML document and returns structured data with function mappings.
   *
   * @param doc The SCL document to process
   * @param substation Optional: process only a specific substation. If omitted, processes entire document.
   * @returns ProcessedDocument containing substations, functionMap, and functionsByElement
   */
  static process(doc: XMLDocument, substation?: Element): ProcessedDocument {
    const substations = substation
      ? [substation]
      : Array.from(doc.querySelectorAll(':root > Substation'));

    const allFunctions = this.extractFunctions(doc, substation);

    const functionsByElement = new Map<Element, ProcessedFunction>();
    allFunctions.forEach(fn => {
      functionsByElement.set(fn.element, fn);
    });

    const functionMap = this.buildFunctionMap(allFunctions);

    const psrTags = [
      'ConductingEquipment',
      'PowerTransformer',
      'Bay',
      'VoltageLevel',
      'Substation',
    ];
    const psrElements = psrTags.flatMap(tag =>
      Array.from(doc.querySelectorAll(tag))
    );

    const hasVoltageLevelOrTransformer = !!doc.querySelector(
      'VoltageLevel, PowerTransformer'
    );
    const hasFunctions = allFunctions.length > 0;
    const hasSubstation = !!doc.querySelector('Substation');
    const hasVoltageLevel = !!doc.querySelector(
      ':root > Substation > VoltageLevel'
    );
    const hasNonBusBarBays = Array.from(
      doc.querySelectorAll(':root > Substation > VoltageLevel > Bay')
    ).some(bay => !isBusBar(bay));

    return {
      substations,
      functionMap,
      functionsByElement,
      allFunctions,
      psrElements,
      hasVoltageLevelOrTransformer,
      hasFunctions,
      hasSubstation,
      hasNonBusBarBays,
      hasVoltageLevel,
    };
  }

  /**
   * Extracts all Function elements with valid SLD coordinates.
   * Resolves PowerSystemRelation references if present.
   *
   * @param doc The SCL document
   * @param substation Optional: scope to a specific substation
   * @returns Array of ProcessedFunction objects
   */
  private static extractFunctions(
    doc: XMLDocument,
    substation?: Element
  ): ProcessedFunction[] {
    const scope: Element | Document = substation ?? doc;
    const functionElements = Array.from(scope.querySelectorAll('Function'));
    const result: ProcessedFunction[] = [];

    functionElements.forEach(fn => {
      const xAttr = getSLDAttributes(fn, 'x');
      const yAttr = getSLDAttributes(fn, 'y');

      if (!xAttr || !yAttr) return;

      const x = Number.parseFloat(xAttr);
      const y = Number.parseFloat(yAttr);

      if (Number.isNaN(x) || Number.isNaN(y)) return;

      const name = fn.getAttribute('name') || 'Unknown';
      const parent = fn.parentElement || null;

      const psrRelationEl = fn.getElementsByTagNameNS(
        eTr6100Ns,
        'PowerSystemRelation'
      )[0];
      const relationPath = psrRelationEl?.getAttribute('relation') || null;
      const referencedElement = relationPath
        ? this.resolveProcessPath(doc, relationPath)
        : null;

      result.push({
        element: fn,
        name,
        x,
        y,
        parent,
        referencedElement,
        relationPath,
      });
    });

    return result;
  }

  /**
   * Resolves a process path string (e.g., "S1/VL1/Bay1/QA1") to the actual Element.
   *
   * @param doc The SCL document
   * @param path Process path string (format: Substation/VoltageLevel/Bay/Equipment)
   * @returns Resolved Element or null if not found
   */
  private static resolveProcessPath(
    doc: XMLDocument,
    path: string
  ): Element | null {
    const parts = path.split('/');
    if (!parts.length || !parts[0]) return null;

    let current: Element | null = doc.querySelector(
      `:root > Substation[name="${parts[0]}"]`
    );

    for (let i = 1; i < parts.length && current; i += 1) {
      const name = parts[i];
      current =
        Array.from(current.children).find(
          child => child.getAttribute('name') === name
        ) ?? null;
    }

    return current;
  }

  /**
   * Builds a Map from SCL elements to their associated functions.
   *
   * A function is associated with an element if:
   * 1. The element is the function's direct DOM parent (Bay/VoltageLevel/Substation), OR
   * 2. The function has a PowerSystemRelation referencing the element (ConductingEquipment/PowerTransformer)
   *
   * This matches the behavior of util.getFunctions() but computed once for all elements.
   *
   * @param allFunctions All processed functions
   * @returns Map<Element, ProcessedFunction[]>
   */
  private static buildFunctionMap(
    allFunctions: ProcessedFunction[]
  ): Map<Element, ProcessedFunction[]> {
    const map = new Map<Element, ProcessedFunction[]>();

    allFunctions.forEach(fn => {
      // Add to direct parent if it's Bay/VoltageLevel/Substation AND has no PowerSystemRelation
      if (
        fn.parent &&
        !fn.referencedElement &&
        (fn.parent.tagName === 'Bay' ||
          fn.parent.tagName === 'VoltageLevel' ||
          fn.parent.tagName === 'Substation')
      ) {
        if (!map.has(fn.parent)) {
          map.set(fn.parent, []);
        }
        map.get(fn.parent)?.push(fn);
      }

      // Add to referenced element if PowerSystemRelation is present
      if (fn.referencedElement) {
        if (!map.has(fn.referencedElement)) {
          map.set(fn.referencedElement, []);
        }
        map.get(fn.referencedElement)?.push(fn);
      }
    });

    return map;
  }
}
