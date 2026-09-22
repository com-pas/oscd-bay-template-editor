import { getReference } from '@openscd/scl-lib';
import type { EditV2 } from '@openscd/oscd-api';
import { eTr6100Ns, eTr6100PrivType, getProcessPath } from '../../util.js';
import {
  buildSourceRefAttributes,
  type LinkService,
  type ObjectReferenceItem,
} from './object-references.js';

interface BuildFunctionLinkEditsParams {
  doc: XMLDocument;
  sinkLNode: Element;
  selectedReferences: ObjectReferenceItem[];
  service: LinkService;
  namespacePrefix: string;
}

function getPrivateContainer(doc: XMLDocument, sinkLNode: Element) {
  const existingPrivate = Array.from(
    sinkLNode.querySelectorAll(':scope > Private')
  ).find(priv => priv.getAttribute('type') === eTr6100PrivType);

  if (existingPrivate)
    return { privateElement: existingPrivate, created: false };

  const privateElement = doc.createElementNS(
    doc.documentElement.namespaceURI,
    'Private'
  );
  privateElement.setAttribute('type', eTr6100PrivType);

  return { privateElement, created: true };
}

function getLNodeInputsContainer(
  doc: XMLDocument,
  privateElement: Element,
  namespacePrefix: string
) {
  const existingInputsContainer = Array.from(privateElement.children).find(
    child =>
      child.namespaceURI === eTr6100Ns && child.localName === 'LNodeInputs'
  );

  if (existingInputsContainer)
    return {
      lNodeInputsElement: existingInputsContainer,
      createdInputsContainer: false,
    };

  return {
    lNodeInputsElement: doc.createElementNS(
      eTr6100Ns,
      `${namespacePrefix}:LNodeInputs`
    ),
    createdInputsContainer: true,
  };
}

function buildSourceRefs(
  doc: XMLDocument,
  selectedReferences: ObjectReferenceItem[],
  service: LinkService,
  namespacePrefix: string,
  existingKeys: Set<string>
): Element[] {
  const sourceRefs: Element[] = [];

  for (const selectedReference of selectedReferences) {
    const attrs = buildSourceRefAttributes(selectedReference);
    const dedupeKey = `${attrs.source}|${service}`;
    if (!existingKeys.has(dedupeKey)) {
      const sourceRef = doc.createElementNS(
        eTr6100Ns,
        `${namespacePrefix}:SourceRef`
      );
      sourceRef.setAttribute('source', attrs.source);
      sourceRef.setAttribute('input', attrs.input);
      sourceRef.setAttribute('pLN', attrs.pLN);
      sourceRef.setAttribute('pDO', attrs.pDO);
      sourceRef.setAttribute('pDA', attrs.pDA);
      sourceRef.setAttribute('service', service);
      existingKeys.add(dedupeKey);
      sourceRefs.push(sourceRef);
    }
  }

  return sourceRefs;
}

function buildEditsForNewSourceRefs(
  sinkLNode: Element,
  privateElement: Element,
  lNodeInputsElement: Element,
  newSourceRefs: Element[],
  createdPrivate: boolean,
  createdInputsContainer: boolean
): EditV2[] {
  const edits: EditV2[] = [];

  if (createdPrivate) {
    edits.push({
      parent: sinkLNode,
      node: privateElement,
      reference: getReference(sinkLNode, 'Private'),
    });
  }

  if (createdInputsContainer) {
    privateElement.appendChild(lNodeInputsElement);
    edits.push({
      parent: privateElement,
      node: lNodeInputsElement,
      reference: null,
    });
  }

  newSourceRefs.forEach(sourceRef => {
    lNodeInputsElement.appendChild(sourceRef);
    edits.push({
      parent: lNodeInputsElement,
      node: sourceRef,
      reference: null,
    });
  });

  return edits;
}

export function buildFunctionLinkEdits({
  doc,
  sinkLNode,
  selectedReferences,
  service,
  namespacePrefix,
}: BuildFunctionLinkEditsParams): EditV2[] {
  const { privateElement, created: createdPrivate } = getPrivateContainer(
    doc,
    sinkLNode
  );
  const { lNodeInputsElement, createdInputsContainer } =
    getLNodeInputsContainer(doc, privateElement, namespacePrefix);

  const existingKeys = new Set(
    Array.from(lNodeInputsElement.children)
      .filter(
        child =>
          child.localName === 'SourceRef' && child.namespaceURI === eTr6100Ns
      )
      .map(
        sourceRef =>
          `${sourceRef.getAttribute('source') ?? ''}|${
            sourceRef.getAttribute('service') ?? ''
          }`
      )
  );

  const newSourceRefs = buildSourceRefs(
    doc,
    selectedReferences,
    service,
    namespacePrefix,
    existingKeys
  );

  if (!newSourceRefs.length) {
    return [];
  }

  return buildEditsForNewSourceRefs(
    sinkLNode,
    privateElement,
    lNodeInputsElement,
    newSourceRefs,
    createdPrivate,
    createdInputsContainer
  );
}

export function buildRemoveSourceRefEdits(
  sourceRefsToRemove: Element[]
): EditV2[] {
  const [firstSourceRef] = sourceRefsToRemove;
  const parentElement = firstSourceRef?.parentElement ?? null;

  const lNodeInputsElement =
    parentElement?.localName === 'LNodeInputs' &&
    parentElement.namespaceURI === eTr6100Ns
      ? parentElement
      : null;

  const removingAllSourceRefs =
    lNodeInputsElement?.querySelectorAll('SourceRef').length ===
    sourceRefsToRemove.length;

  if (!removingAllSourceRefs) {
    return lNodeInputsElement?.querySelectorAll('SourceRef')
      ? Array.from(lNodeInputsElement.querySelectorAll('SourceRef'))
          .filter(child => sourceRefsToRemove.includes(child))
          .map(sourceRef => ({ node: sourceRef }))
      : [];
  }

  const privateElement = lNodeInputsElement!.parentElement;
  const privateBecomesEmpty =
    privateElement?.localName === 'Private' &&
    privateElement.getAttribute('type') === eTr6100PrivType &&
    privateElement.children.length === 1;

  return [
    {
      node: privateBecomesEmpty
        ? (privateElement as Element)
        : lNodeInputsElement,
    },
  ];
}

function buildLNodeIdentityPath(lnode: Element): string | null {
  const func = lnode.closest('Function, EqFunction');
  if (!func) return null;

  const subFunction = lnode.closest('SubFunction, EqSubFunction');
  const lnClass = lnode.getAttribute('lnClass') ?? '';
  const lnInst = lnode.getAttribute('lnInst') ?? '';
  const lnodeName = `${lnClass}${lnInst}`;
  const funcPath = getProcessPath(func);

  return subFunction
    ? `${funcPath}/${subFunction.getAttribute('name') ?? ''}/${lnodeName}`
    : `${funcPath}/${lnodeName}`;
}

/** Finds all SourceRef elements anywhere in the document whose `source` points at `lnode`. */
export function findSourceRefsPointingToLNode(lnode: Element): Element[] {
  const path = buildLNodeIdentityPath(lnode);
  const doc = lnode.ownerDocument;
  if (!path || !doc) return [];

  const prefix = `${path}.`;
  return Array.from(doc.getElementsByTagNameNS(eTr6100Ns, 'SourceRef')).filter(
    sourceRef => (sourceRef.getAttribute('source') ?? '').startsWith(prefix)
  );
}

/** Whether `lnode` is a sink of information (has its own LNodeInputs/SourceRef). */
export function isLNodeSink(lnode: Element): boolean {
  return lnode.getElementsByTagNameNS(eTr6100Ns, 'SourceRef').length > 0;
}

/** Whether `lnode` is used as a source and/or sink in any existing function link. */
export function lNodeHasLinks(lnode: Element): boolean {
  return isLNodeSink(lnode) || findSourceRefsPointingToLNode(lnode).length > 0;
}

function groupByParent(elements: Element[]): Element[][] {
  const groups = new Map<Element, Element[]>();
  elements.forEach(el => {
    const parent = el.parentElement;
    if (!parent) return;
    const list = groups.get(parent) ?? [];
    list.push(el);
    groups.set(parent, list);
  });
  return Array.from(groups.values());
}

/**
 * Builds edits to remove `lnode` itself and, for any SourceRef elsewhere in the
 * document pointing at it, removes those SourceRef elements (or their containing
 * LNodeInputs/Private, if that container would otherwise become empty).
 */
export function buildRemoveLNodeEdits(lnode: Element): EditV2[] {
  const sourceRefs = findSourceRefsPointingToLNode(lnode);
  const edits: EditV2[] = groupByParent(sourceRefs).flatMap(group =>
    buildRemoveSourceRefEdits(group)
  );
  edits.push({ node: lnode });
  return edits;
}
