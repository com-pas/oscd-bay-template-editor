import { getReference } from '@openscd/scl-lib';
import type { EditV2 } from '@openscd/oscd-api';
import { createElement } from '@compas-oscd/xml';
import {
  createLNodeFromType,
  eTr6100Ns,
  getChildrenByTagName,
  getProcessPath,
  isInsideAny,
  isLNodeType,
  type FunctionData,
  type SubFunctionData,
} from '../../util.js';
import { buildRemoveSourceRefsToLNodesEdits } from '../function-link-dialog/link-edits.js';

export interface UpdateFunctionData extends FunctionData {
  functionElement: Element;
}

export interface UpdateFunctionEdits {
  edits: EditV2[];
  newLNodeTypes: Element[];
}

interface Removals {
  elements: Element[];
  sourceRefEdits: EditV2[];
}

interface PathRenames {
  oldFunctionPath: string;
  newFunctionPath: string;
  subFunctionRenames: Map<string, string>;
}

function subFunctionTagOf(functionElement: Element): string {
  return functionElement.tagName === 'EqFunction'
    ? 'EqSubFunction'
    : 'SubFunction';
}

function sclAttributes({
  name,
  description,
  type,
}: Pick<FunctionData, 'name' | 'description' | 'type'>) {
  return { name, desc: description, type };
}

export function getInsertReference(
  parent: Element,
  tag: string,
  excluded: Iterable<Element>
): Element | null {
  const skip = new Set(excluded);
  let reference = getReference(parent, tag);
  while (reference && skip.has(reference))
    reference = reference.nextElementSibling;
  return reference;
}

export function createSubFunctionElement(
  doc: XMLDocument,
  tag: string,
  subFunction: SubFunctionData
): Element {
  const element = createElement(doc, tag, sclAttributes(subFunction));
  subFunction.lnodes
    .filter(isLNodeType)
    .forEach(lNodeType =>
      element.appendChild(createLNodeFromType(doc, lNodeType))
    );
  return element;
}

function buildChangedAttributeEdits(
  element: Element,
  attributes: Record<string, string | null>
): EditV2[] {
  const changed = Object.fromEntries(
    Object.entries(attributes).filter(
      ([key, value]) => element.getAttribute(key) !== value
    )
  );
  return Object.keys(changed).length ? [{ element, attributes: changed }] : [];
}

function removedLNodesOf(parent: Element, keptLNodes: Element[]): Element[] {
  return getChildrenByTagName(parent, 'LNode').filter(
    lnode => !keptLNodes.includes(lnode)
  );
}

function collectRemovals({
  lnodes,
  subFunctions,
  functionElement,
}: UpdateFunctionData): Removals {
  const keptSubFunctions = new Set(subFunctions.map(sf => sf.element));
  const deletedSubFunctions = getChildrenByTagName(
    functionElement,
    subFunctionTagOf(functionElement)
  ).filter(subFunction => !keptSubFunctions.has(subFunction));

  const removedLNodes = [
    ...removedLNodesOf(functionElement, lnodes),
    ...subFunctions.flatMap(sf =>
      sf.element ? removedLNodesOf(sf.element, sf.lnodes) : []
    ),
  ];
  const elements = [...removedLNodes, ...deletedSubFunctions];

  const sourceRefEdits = buildRemoveSourceRefsToLNodesEdits(
    [
      ...removedLNodes,
      ...deletedSubFunctions.flatMap(sf =>
        Array.from(sf.getElementsByTagName('LNode'))
      ),
    ],
    elements
  );

  return { elements, sourceRefEdits };
}

function collectPathRenames({
  name,
  subFunctions,
  functionElement,
}: UpdateFunctionData): PathRenames {
  const oldFunctionPath = getProcessPath(functionElement);
  const newFunctionPath = `${oldFunctionPath.slice(
    0,
    oldFunctionPath.lastIndexOf('/') + 1
  )}${name}`;

  const subFunctionRenames = new Map<string, string>();
  subFunctions.forEach(({ element, name: newName }) => {
    if (!element) return;
    const oldName = element.getAttribute('name') ?? '';
    if (oldName !== newName) subFunctionRenames.set(oldName, newName);
  });

  return { oldFunctionPath, newFunctionPath, subFunctionRenames };
}

function buildSourceRefRenameEdits(
  doc: XMLDocument,
  { oldFunctionPath, newFunctionPath, subFunctionRenames }: PathRenames,
  removedNodes: ReadonlySet<Element>
): EditV2[] {
  if (oldFunctionPath === newFunctionPath && subFunctionRenames.size === 0)
    return [];

  const oldPrefix = `${oldFunctionPath}/`;
  const edits: EditV2[] = [];

  Array.from(doc.getElementsByTagNameNS(eTr6100Ns, 'SourceRef')).forEach(
    sourceRef => {
      if (isInsideAny(sourceRef, removedNodes)) return;

      const source = sourceRef.getAttribute('source') ?? '';
      if (!source.startsWith(oldPrefix)) return;

      let rest = source.slice(oldPrefix.length);
      const separator = rest.indexOf('/');
      if (separator > 0) {
        const newSubFunctionName = subFunctionRenames.get(
          rest.slice(0, separator)
        );
        if (newSubFunctionName !== undefined)
          rest = `${newSubFunctionName}${rest.slice(separator)}`;
      }

      const newSource = `${newFunctionPath}/${rest}`;
      if (newSource !== source)
        edits.push({ element: sourceRef, attributes: { source: newSource } });
    }
  );

  return edits;
}

export function buildUpdateFunctionEdits(
  doc: XMLDocument,
  update: UpdateFunctionData
): UpdateFunctionEdits {
  const { lnodes, subFunctions, functionElement } = update;
  const subFunctionTag = subFunctionTagOf(functionElement);
  const removals = collectRemovals(update);

  const insertNewLNodes = (parent: Element, entries: Element[]): EditV2[] =>
    entries.filter(isLNodeType).map(lNodeType => ({
      parent,
      node: createLNodeFromType(doc, lNodeType),
      reference: getInsertReference(parent, 'LNode', removals.elements),
    }));

  const subFunctionEdits = subFunctions.flatMap((sf): EditV2[] =>
    sf.element
      ? [
          ...buildChangedAttributeEdits(sf.element, sclAttributes(sf)),
          ...insertNewLNodes(sf.element, sf.lnodes),
        ]
      : [
          {
            parent: functionElement,
            node: createSubFunctionElement(doc, subFunctionTag, sf),
            reference: getInsertReference(
              functionElement,
              subFunctionTag,
              removals.elements
            ),
          },
        ]
  );

  const removedNodes = new Set<Element>([
    ...removals.elements,
    ...removals.sourceRefEdits.map(edit => (edit as { node: Element }).node),
  ]);

  const edits: EditV2[] = [
    ...buildChangedAttributeEdits(functionElement, sclAttributes(update)),
    ...removals.sourceRefEdits,
    ...removals.elements.map(node => ({ node })),
    ...insertNewLNodes(functionElement, lnodes),
    ...subFunctionEdits,
    ...buildSourceRefRenameEdits(doc, collectPathRenames(update), removedNodes),
  ];

  const newLNodeTypes = [
    ...lnodes,
    ...subFunctions.flatMap(sf => sf.lnodes),
  ].filter(isLNodeType);

  return { edits, newLNodeTypes };
}
