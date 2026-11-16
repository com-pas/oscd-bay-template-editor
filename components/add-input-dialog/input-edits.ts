import type { EditV2 } from '@openscd/oscd-api';
import { getReference } from '@openscd/scl-lib';
import { eTr6100Ns, eTr6100PrivType, xmlnsNs } from '../../util.js';
import {
  getPrivateContainer,
  getLNodeInputsContainer,
} from '../function-link-dialog/link-edits.js';
import type { SaveInputDetail } from './add-input-dialog.js';

interface BuildInputEditsParams extends Omit<SaveInputDetail, 'context'> {
  doc: XMLDocument;
  sinkLNode: Element;
}

export function getBayProcessResources(bay: Element): Element[] {
  return Array.from(bay.children)
    .filter(
      child =>
        child.localName === 'Private' &&
        child.getAttribute('type') === eTr6100PrivType
    )
    .flatMap(priv =>
      Array.from(priv.children).filter(
        child =>
          child.localName === 'ProcessResources' &&
          child.namespaceURI === eTr6100Ns
      )
    );
}

export function buildInputEdits({
  doc,
  sinkLNode,
  resourceName,
  description,
  sourceClass,
  dataObject,
  dataAttribute,
  inputName,
}: BuildInputEditsParams): EditV2[] {
  const bay = sinkLNode.closest('Bay');
  if (
    sinkLNode.localName !== 'LNode' ||
    !bay ||
    !doc.documentElement.contains(sinkLNode)
  )
    throw new Error('The sink LNode is no longer available in a bay.');
  if (!resourceName.trim() || !dataObject.trim() || !inputName.trim())
    throw new Error('Resource name, data object and Input name are required.');
  if (!/^[A-Z][A-Z0-9]{3}$/.test(sourceClass))
    throw new Error('Choose a valid source logical-node class.');

  const containers = getBayProcessResources(bay);
  if (containers.length > 1)
    throw new Error(
      'This bay contains more than one ProcessResources container.'
    );
  if (
    containers.some(container =>
      Array.from(container.children).some(
        child =>
          child.namespaceURI === eTr6100Ns &&
          child.localName === 'ProcessResource' &&
          child.getAttribute('name') === resourceName
      )
    )
  )
    throw new Error('Resource name already exists in this bay.');

  const edits: EditV2[] = [];
  const root = doc.documentElement;
  let prefix = root.lookupPrefix(eTr6100Ns);
  if (!prefix) {
    prefix = eTr6100PrivType;
    let suffix = 1;
    while (root.lookupNamespaceURI(prefix)) {
      prefix = `${eTr6100PrivType}_${suffix}`;
      suffix += 1;
    }
    edits.push({
      element: root,
      attributesNS: { [xmlnsNs]: { [`xmlns:${prefix}`]: eTr6100Ns } },
    });
  }

  const resource = doc.createElementNS(eTr6100Ns, `${prefix}:ProcessResource`);
  resource.setAttribute('name', resourceName);
  if (description) resource.setAttribute('desc', description);
  resource.setAttribute(
    'selector',
    `ancestor::VoltageLevel//LNode[@lnClass='${sourceClass}']`
  );
  resource.setAttribute('cardinality', '1..1');

  const [existingContainer] = containers;
  if (existingContainer) {
    edits.push({ parent: existingContainer, node: resource, reference: null });
  } else {
    const { privateElement, created } = getPrivateContainer(doc, bay);
    const container = doc.createElementNS(
      eTr6100Ns,
      `${prefix}:ProcessResources`
    );
    container.append(resource);
    if (created) {
      privateElement.append(container);
      edits.push({
        parent: bay,
        node: privateElement,
        reference: getReference(bay, 'Private'),
      });
    } else {
      edits.push({ parent: privateElement, node: container, reference: null });
    }
  }

  const sourceRef = doc.createElementNS(eTr6100Ns, `${prefix}:SourceRef`);
  sourceRef.setAttribute('input', inputName);
  sourceRef.setAttribute('resourceName', resourceName);
  sourceRef.setAttribute('pLN', sourceClass);
  sourceRef.setAttribute('pDO', dataObject);
  if (dataAttribute) sourceRef.setAttribute('pDA', dataAttribute);

  const { privateElement, created } = getPrivateContainer(doc, sinkLNode);
  const { lNodeInputsElement, createdInputsContainer } =
    getLNodeInputsContainer(doc, privateElement, prefix);
  if (created) {
    lNodeInputsElement.append(sourceRef);
    privateElement.append(lNodeInputsElement);
    edits.push({
      parent: sinkLNode,
      node: privateElement,
      reference: getReference(sinkLNode, 'Private'),
    });
  } else if (createdInputsContainer) {
    lNodeInputsElement.append(sourceRef);
    edits.push({
      parent: privateElement,
      node: lNodeInputsElement,
      reference: null,
    });
  } else {
    edits.push({
      parent: lNodeInputsElement,
      node: sourceRef,
      reference: null,
    });
  }

  return edits;
}
