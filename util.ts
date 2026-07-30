import { getReference } from '@openscd/scl-lib';
import { EditV2 } from '@openscd/oscd-api';

export const privType = 'OpenSCD-SLD-Layout';
export const sldNs = 'https://openscd.org/SCL/SSD/SLD/v0';
export const xmlnsNs = 'http://www.w3.org/2000/xmlns/';
export const eTr6100Ns = 'http://www.iec.ch/61850/2019/SCL/6-100';
export const eTr6100NsPrefix = 'eTr_6-100';
export const eTr6100PrivType = 'eIEC61850-6-100';
export const svgNs = 'http://www.w3.org/2000/svg';
export const xlinkNs = 'http://www.w3.org/1999/xlink';

export const eqTypes = [
  'CAB',
  'CAP',
  'CBR',
  'CTR',
  'DIS',
  'GEN',
  'IFL',
  'LIN',
  'MOT',
  'REA',
  'RES',
  'SAR',
  'SMC',
  'VTR',
] as const;
export type EqType = (typeof eqTypes)[number];
export function isEqType(str: string): str is EqType {
  return eqTypes.includes(str as EqType);
}
export const ringedEqTypes = new Set(['GEN', 'MOT', 'SMC']);
export const singleTerminal = new Set([
  'BAT',
  'EFN',
  'FAN',
  'GEN',
  'IFL',
  'MOT',
  'PMP',
  'RRC',
  'SAR',
  'SMC',
  'VTR',
]);

export interface LNodeData {
  lnClass: string;
  desc: string | null;
}

export interface SubfunctionData {
  name: string;
  description: string | null;
  type: string | null;
  lnodes: LNodeData[] | null;
}

function sections(element: Element): Element[] {
  return Array.from(
    element.querySelectorAll(`:scope Private[type="${privType}"] > Section`)
  );
}

function sldAttributes(element: Element, nsPrefix?: string): Element | null {
  const sldAttrs = element.querySelector(
    `:scope > Private[type="${privType}"] > SLDAttributes`
  );

  if (sldAttrs) return sldAttrs;
  if (!nsPrefix) return null;

  const priv = element.ownerDocument.createElementNS(
    element.namespaceURI,
    'Private'
  );
  priv.setAttribute('type', privType);
  element.insertBefore(priv, getReference(element, 'Private'));

  const sldAttrsNew = element.ownerDocument.createElementNS(
    sldNs,
    `${nsPrefix}:SLDAttributes`
  );
  priv.insertBefore(sldAttrsNew, null);

  return sldAttrsNew;
}

export function setSLDAttributes(
  element: Element,
  nsPrefix: string,
  values: Record<string, string>
): void {
  const isSectionOrVertex = ['Section', 'Vertex'].includes(element.localName);

  if (isSectionOrVertex) {
    Object.entries(values).forEach(([key, value]) => {
      element.setAttributeNS(sldNs, `${nsPrefix}:${key}`, value);
    });
  } else {
    Object.entries(values).forEach(([key, value]) =>
      sldAttributes(element, nsPrefix)?.setAttributeNS(
        sldNs,
        `${nsPrefix}:${key}`,
        value
      )
    );
  }
}

export function getSLDAttributes(element: Element, key: string): string | null {
  const isSecOrVert = ['Section', 'Vertex'].includes(element.localName);
  if (isSecOrVert) return element.getAttributeNS(sldNs, key);

  return sldAttributes(element)?.getAttributeNS(sldNs, key) ?? null;
}

export function updateSLDAttributes(
  element: Element,
  nsPrefix: string,
  values: Partial<Record<string, string | null>>
): EditV2 {
  const isSecOrVert = ['Section', 'Vertex'].includes(element.localName);
  const toBeUpdated = isSecOrVert ? element : sldAttributes(element, nsPrefix)!;

  return {
    element: toBeUpdated,
    attributesNS: {
      [sldNs]: Object.fromEntries(
        Object.entries(values).map(([key, value]) => [
          `${nsPrefix}:${key}`,
          value,
        ])
      ),
    },
  };
}

export function busSections(element: Element): Element[] {
  return sections(element).filter(
    section => getSLDAttributes(section, 'bus') === 'true'
  );
}

function containsBusSection(element: Element): boolean {
  return busSections(element).length > 0;
}

export function isBusBar(element: Element) {
  return element.tagName === 'Bay' && containsBusSection(element);
}

export function makeBusBar(doc: XMLDocument, nsp: string) {
  const busBar = doc.createElementNS(doc.documentElement.namespaceURI, 'Bay');
  busBar.setAttribute('name', 'BB1');
  setSLDAttributes(busBar, nsp, { w: '2' });
  const cNode = doc.createElementNS(
    doc.documentElement.namespaceURI,
    'ConnectivityNode'
  );
  cNode.setAttribute('name', 'L');
  const priv = doc.createElementNS(doc.documentElement.namespaceURI, 'Private');
  priv.setAttribute('type', privType);
  const section = doc.createElementNS(sldNs, `${nsp}:Section`);
  setSLDAttributes(section, nsp, { bus: 'true' });
  const v1 = doc.createElementNS(sldNs, `${nsp}:Vertex`);
  setSLDAttributes(v1, nsp, { x: '0.5', y: '0.5' });
  section.appendChild(v1);
  const v2 = doc.createElementNS(sldNs, `${nsp}:Vertex`);
  setSLDAttributes(v2, nsp, { x: '1.5', y: '0.5' });
  section.appendChild(v2);
  priv.appendChild(section);
  cNode.appendChild(priv);
  busBar.appendChild(cNode);
  return busBar;
}

export function uniqueName(element: Element, parent: Element): string {
  const children = Array.from(parent.children);
  const oldName = element.getAttribute('name');
  if (
    oldName &&
    !children.find(child => child.getAttribute('name') === oldName)
  )
    return oldName;

  const baseName =
    element.getAttribute('name')?.replace(/[0-9]*$/, '') ??
    element.getAttribute('type') ??
    element.tagName.charAt(0);
  let index = 1;
  function hasName(child: Element) {
    return child.getAttribute('name') === baseName + index.toString();
  }
  while (children.find(hasName)) index += 1;

  return baseName + index.toString();
}

function getCenter(el: Element | null): { x: number; y: number } {
  const parentW = el ? parseFloat(getSLDAttributes(el, 'w') ?? '0') : 0;
  const parentH = el ? parseFloat(getSLDAttributes(el, 'h') ?? '0') : 0;
  const parentX = el ? parseFloat(getSLDAttributes(el, 'x') ?? '0') : 0;
  const parentY = el ? parseFloat(getSLDAttributes(el, 'y') ?? '0') : 0;
  const centerX = Math.round(parentX + parentW / 2);
  const centerY = Math.round(parentY + parentH / 2);
  return { x: centerX, y: centerY };
}

/**
 * Calculates coordinates for a new Function element.
 * - Centers in substation for Bay/VoltageLevel parents.
 * - Otherwise, places below parent or sibling with coordinates, or centers in substation as fallback.
 * - Avoids stacking by offsetting if position is occupied.
 * @param doc XMLDocument containing the SCL structure
 * @param parent Parent element under which the function is created
 * @returns { x, y } coordinates for the new function
 */
export function getFunctionCoordinates(
  doc: XMLDocument,
  parent: Element
): { x: number; y: number } {
  let x = 1;
  let y = 1;

  // For Substation, place at top-left corner of SLD canvas
  if (parent.tagName === 'Substation') {
    x = 1;
    y = 1;
  } else {
    // Place below parent if it has coordinates
    const parentX = getSLDAttributes(parent, 'x');
    const parentY = getSLDAttributes(parent, 'y');
    if (parentX && parentY) {
      x = parseFloat(parentX) + 1;
      y = parseFloat(parentY) + 1;
    } else {
      const childWithCoords = Array.from(parent.children).find(
        el => getSLDAttributes(el, 'x') && getSLDAttributes(el, 'y')
      );
      if (childWithCoords) {
        x = parseFloat(getSLDAttributes(childWithCoords, 'x')!);
        y = parseFloat(getSLDAttributes(childWithCoords, 'y')!) + 2;
      } else {
        // Fallback: center in substation
        const substation = parent.closest('Substation');
        const center = getCenter(substation);
        x = center.x;
        y = center.y;
      }
    }
  }

  // Avoid stacking: offset if position is occupied by another Function/EqFunction
  const existingFunctions = Array.from(
    doc.querySelectorAll('Function, EqFunction')
  );
  function isOccupied(testX: number, testY: number): boolean {
    return existingFunctions.some(fn => {
      const fx = parseFloat(getSLDAttributes(fn, 'x') ?? 'NaN');
      const fy = parseFloat(getSLDAttributes(fn, 'y') ?? 'NaN');
      return fx === testX && fy === testY;
    });
  }

  let offsetTries = 20;
  while (isOccupied(x, y) && offsetTries > 0) {
    x += 1;
    y += 1;
    offsetTries -= 1;
  }

  return { x, y };
}

export function getProcessPath(element: Element): string {
  const startingElementName = element.getAttribute('name') ?? '';
  const pathParts: string[] = [startingElementName];

  let currentElement = element;
  while (currentElement.parentElement) {
    currentElement = currentElement.parentElement;

    const elementName = currentElement.getAttribute('name') ?? '';
    pathParts.push(elementName);

    if (currentElement.tagName === 'Substation') {
      break;
    }
  }

  return pathParts.reverse().join('/');
}

export function createPowerSystemRelationPrivate(
  doc: XMLDocument,
  path: string
): Element {
  const nsp = doc.documentElement.lookupPrefix(eTr6100Ns) ?? eTr6100NsPrefix;

  if (!doc.documentElement.lookupPrefix(eTr6100Ns)) {
    doc.documentElement.setAttributeNS(
      xmlnsNs,
      `xmlns:${eTr6100NsPrefix}`,
      eTr6100Ns
    );
  }

  const priv = doc.createElementNS(doc.documentElement.namespaceURI, 'Private');
  priv.setAttribute('type', eTr6100PrivType);

  const relations = doc.createElementNS(
    eTr6100Ns,
    `${nsp}:PowerSystemRelations`
  );
  const relation = doc.createElementNS(eTr6100Ns, `${nsp}:PowerSystemRelation`);
  relation.setAttribute('relation', path);

  relations.appendChild(relation);
  priv.appendChild(relations);
  return priv;
}

/**
 * Returns Function elements associated with a given SCL element.
 *
 * - For Bay, VoltageLevel, Substation: returns direct child Function elements
 *   that have no PowerSystemRelation private (i.e. not linked to specific equipment).
 * - For ConductingEquipment, PowerTransformer and TransformerWinding:
 *  returns direct child EqFunction elements.
 */
export function getFunctions(element: Element): Element[] {
  const { tagName } = element;

  if (
    tagName === 'Bay' ||
    tagName === 'VoltageLevel' ||
    tagName === 'Substation'
  ) {
    return Array.from(
      element.querySelectorAll(
        `:scope > Function:not(:has(> Private[type="${eTr6100PrivType}"]))`
      )
    );
  }

  if (
    tagName === 'ConductingEquipment' ||
    tagName === 'PowerTransformer' ||
    tagName === 'TransformerWinding'
  ) {
    return Array.from(element.querySelectorAll(':scope > EqFunction'));
  }

  return [];
}

/**
 * Returns all SLD SVG canvases from sld-editor, one per Substations
 *
 * WORKAROUND: relies on internal shadow DOM structure.
 */
export function getSldSvgs(sldEditor: Element): SVGSVGElement[] {
  const substationEditors = Array.from(
    sldEditor.shadowRoot?.querySelectorAll(
      'sld-substation-editor, sld-substation-viewer'
    ) ?? []
  );
  return substationEditors.flatMap(se => {
    const svg = se.shadowRoot?.querySelector('svg#sld') as SVGSVGElement | null;
    return svg ? [svg] : [];
  });
}

/**
 * Extracts shape elements (line, path, rect, polyline) from SVG elements.
 */
function extractShapeElements(elements: SVGElement[]): SVGElement[] {
  const shapeElements: SVGElement[] = [];
  const shapeSelectors = 'line, path, rect, polyline';

  elements.forEach(el => {
    if (el.tagName === 'g') {
      const children = Array.from(
        el.querySelectorAll(shapeSelectors)
      ) as SVGElement[];
      shapeElements.push(...children);
    } else if (['line', 'path', 'rect', 'polyline'].includes(el.tagName)) {
      shapeElements.push(el);
    }
  });

  return shapeElements;
}

/**
 * Finds horizontal elements by filtering based on aspect ratio and minimum width.
 */
function findHorizontalElements(
  elements: SVGElement[],
  minAspectRatio: number,
  minWidth: number
): Array<{ element: SVGElement; bbox: DOMRect }> {
  const elementBoxes = elements.map(el => ({
    element: el,
    bbox: (el as SVGGraphicsElement).getBBox(),
  }));

  return elementBoxes.filter(
    eb =>
      eb.bbox.width > eb.bbox.height * minAspectRatio &&
      eb.bbox.width > minWidth
  );
}

/**
 * Adds click handlers to busbar line elements to dispatch selection events.
 */
function addClickHandlers(
  elements: Array<{ element: SVGElement; bbox: DOMRect }>,
  busbar: Element,
  sldEditor: Element
): void {
  elements.forEach(({ element }) => {
    element.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      sldEditor.dispatchEvent(
        new CustomEvent('oscd-sld-selected', {
          detail: { element: busbar },
          bubbles: true,
          composed: true,
        })
      );
    });
  });
}

/**
 * Calculates the combined bounding box for multiple elements.
 */
function calculateCombinedBoundingBox(
  elements: Array<{ element: SVGElement; bbox: DOMRect }>
): { x: number; y: number; width: number; height: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  elements.forEach(({ bbox }) => {
    minX = Math.min(minX, bbox.x);
    minY = Math.min(minY, bbox.y);
    maxX = Math.max(maxX, bbox.x + bbox.width);
    maxY = Math.max(maxY, bbox.y + bbox.height);
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Creates an SVG rectangle element with the specified styling.
 */
function createHighlightRectangle(
  bbox: { x: number; y: number; width: number; height: number },
  padding: number,
  style: {
    stroke: string;
    strokeWidth: number;
    fill: string;
    opacity?: number;
  }
): SVGRectElement {
  const rect = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'rect'
  ) as SVGRectElement;

  rect.setAttribute('x', `${bbox.x - padding}`);
  rect.setAttribute('y', `${bbox.y - padding}`);
  rect.setAttribute('width', `${bbox.width + padding * 2}`);
  rect.setAttribute('height', `${bbox.height + padding * 2}`);
  rect.setAttribute('fill', style.fill);
  rect.setAttribute('stroke', style.stroke);
  rect.setAttribute('stroke-width', `${style.strokeWidth}`);
  if (style.opacity !== undefined) {
    rect.setAttribute('opacity', `${style.opacity}`);
  }
  rect.setAttribute('pointer-events', 'all');

  return rect;
}

/**
 * Adds a click handler to an element to dispatch a selection event.
 */
function addClickHandler(
  element: SVGElement,
  busbar: Element,
  sldEditor: Element
): void {
  element.addEventListener('click', () => {
    sldEditor.dispatchEvent(
      new CustomEvent('oscd-sld-selected', {
        detail: { element: busbar },
        bubbles: true,
        composed: true,
      })
    );
  });
}

/**
 * Highlights busbars in the SLD editor by directly manipulating the SVG DOM.
 * WORKAROUND: The sld-editor doesn't properly highlight busbars.
 *
 * @param sldEditor The sld-editor element
 * @param busbars Array of Bay elements that are busbars
 * @param highlightStyle The style to apply to busbar highlights
 */
export function highlightBusbars(
  sldEditor: Element,
  busbars: Element[],
  highlightStyle: {
    stroke: string;
    strokeWidth: number;
    fill: string;
    opacity?: number;
  }
): void {
  if (busbars.length === 0) return;

  const svgs = getSldSvgs(sldEditor);
  const PADDING = 0.15;
  const MIN_ASPECT_RATIO = 2;
  const MIN_WIDTH = 0.5;

  svgs.forEach(svg => {
    busbars.forEach(busbar => {
      const bayName = busbar.getAttribute('name');
      if (!bayName) return;

      const selectors =
        `[data-name="${bayName}"], ` +
        `[data-bay-name="${bayName}"], ` +
        `[id*="${bayName}"], ` +
        `g[data-type="bay"][data-name="${bayName}"], ` +
        `g.bay[data-name="${bayName}"]`;

      let svgElements: SVGElement[] = [];
      try {
        svgElements = Array.from(
          svg.querySelectorAll(selectors)
        ) as SVGElement[];
      } catch {
        console.warn(`Invalid selectors for bay "${bayName}": ${selectors}`);
      }

      if (svgElements.length === 0) return;

      try {
        const shapeElements = extractShapeElements(svgElements);
        if (shapeElements.length === 0) return;

        const horizontalElements = findHorizontalElements(
          shapeElements,
          MIN_ASPECT_RATIO,
          MIN_WIDTH
        );
        if (horizontalElements.length === 0) return;

        addClickHandlers(horizontalElements, busbar, sldEditor);

        const bbox = calculateCombinedBoundingBox(horizontalElements);

        const highlightRect = createHighlightRectangle(
          bbox,
          PADDING,
          highlightStyle
        );
        addClickHandler(highlightRect, busbar, sldEditor);
        highlightRect.classList.add('busbar-highlight-workaround');

        svgElements[0].parentElement?.insertBefore(
          highlightRect,
          svgElements[0]
        );
      } catch {
        console.warn(`Failed to highlight busbar "${bayName}"`);
      }
    });
  });
}

/**
 * Removes busbar highlights applied by highlightBusbars.
 *
 * @param sldEditor The sld-editor element
 */
export function clearBusbarHighlights(sldEditor: Element): void {
  const svgs = getSldSvgs(sldEditor);

  svgs.forEach(svg => {
    const highlightElements = svg.querySelectorAll(
      '.busbar-highlight-workaround'
    );
    highlightElements.forEach(el => el.remove());
  });
}
