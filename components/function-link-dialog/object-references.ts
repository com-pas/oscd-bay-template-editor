import { getProcessPath } from '../../util.js';

export type LinkService = 'GOOSE' | 'SMV' | 'Internal';

export interface ObjectReferenceItem {
  id: string;
  groupKey: string;
  groupLabel: string;
  lnodeName: string;
  lnClass: string;
  lnInst: string;
  doName: string;
  daPath: string;
  shortPath: string;
  fullSource: string;
}

export interface ObjectReferenceGroup {
  key: string;
  label: string;
  items: ObjectReferenceItem[];
}

export interface SourceRefAttributes {
  source: string;
  input: string;
  pLN: string;
  pDO: string;
  pDA: string;
}

interface TypeIndexMaps {
  lNodeTypeById: Map<string, Element>;
  doTypeById: Map<string, Element>;
  daTypeById: Map<string, Element>;
}

interface LNodeContext {
  lnode: Element;
  subFunctionName: string | null;
}

function getChildrenByTagName(parent: Element, tagName: string): Element[] {
  return Array.from(parent.children).filter(child => child.tagName === tagName);
}

function buildDataTypeTemplateMaps(
  dataTypeTemplates: Element[]
): TypeIndexMaps {
  const lNodeTypeById = new Map<string, Element>();
  const doTypeById = new Map<string, Element>();
  const daTypeById = new Map<string, Element>();

  dataTypeTemplates.forEach(dataTypeTemplate => {
    getChildrenByTagName(dataTypeTemplate, 'LNodeType').forEach(lNodeType => {
      const id = lNodeType.getAttribute('id');
      if (id) lNodeTypeById.set(id, lNodeType);
    });

    getChildrenByTagName(dataTypeTemplate, 'DOType').forEach(doType => {
      const id = doType.getAttribute('id');
      if (id) doTypeById.set(id, doType);
    });

    getChildrenByTagName(dataTypeTemplate, 'DAType').forEach(daType => {
      const id = daType.getAttribute('id');
      if (id) daTypeById.set(id, daType);
    });
  });

  return { lNodeTypeById, doTypeById, daTypeById };
}

function getLNodeType(
  lnode: Element,
  typeIndexMaps: TypeIndexMaps
): Element | null {
  const lnTypeId = lnode.getAttribute('lnType');
  if (!lnTypeId) return null;

  return typeIndexMaps.lNodeTypeById.get(lnTypeId) ?? null;
}

function collectDaPathsFromDaType(
  daTypeId: string,
  prefix: string[],
  daTypeById: Map<string, Element>
): string[] {
  const daType = daTypeById.get(daTypeId);
  if (!daType) return [];

  const result: string[] = [];

  getChildrenByTagName(daType, 'BDA').forEach(bda => {
    const bdaName = bda.getAttribute('name');
    if (!bdaName) return;

    const nextPrefix = [...prefix, bdaName];
    const bType = bda.getAttribute('bType');
    const nestedDataTypeId = bda.getAttribute('type');

    if (bType === 'Struct' && nestedDataTypeId) {
      result.push(
        ...collectDaPathsFromDaType(nestedDataTypeId, nextPrefix, daTypeById)
      );
      return;
    }

    result.push(nextPrefix.join('.'));
  });

  return result;
}

function collectDaPathsFromDoType(
  doTypeId: string,
  prefix: string[],
  doTypeById: Map<string, Element>,
  daTypeById: Map<string, Element>
): string[] {
  const doType = doTypeById.get(doTypeId);
  if (!doType) return [];

  const result: string[] = [];

  getChildrenByTagName(doType, 'DA').forEach(da => {
    const daName = da.getAttribute('name');
    if (!daName) return;

    const nextPrefix = [...prefix, daName];
    const bType = da.getAttribute('bType');
    const nestedDataTypeId = da.getAttribute('type');

    if (bType === 'Struct' && nestedDataTypeId) {
      result.push(
        ...collectDaPathsFromDaType(nestedDataTypeId, nextPrefix, daTypeById)
      );
      return;
    }

    result.push(nextPrefix.join('.'));
  });

  getChildrenByTagName(doType, 'SDO').forEach(sdo => {
    const sdoName = sdo.getAttribute('name');
    const nestedDoTypeId = sdo.getAttribute('type');
    if (!sdoName || !nestedDoTypeId) return;

    result.push(
      ...collectDaPathsFromDoType(
        nestedDoTypeId,
        [...prefix, sdoName],
        doTypeById,
        daTypeById
      )
    );
  });

  return result;
}

function buildLNodeName(lnode: Element): string {
  const lnClass = lnode.getAttribute('lnClass') ?? '';
  const lnInst = lnode.getAttribute('lnInst') ?? '';
  return `${lnClass}${lnInst}`;
}

function buildGroupLabel(
  lnodeName: string,
  subFunctionName: string | null
): string {
  if (!subFunctionName) {
    return `${lnodeName} · function level`;
  }

  return `${lnodeName} · subfunction ${subFunctionName}`;
}

function buildGroupKey(
  lnodeName: string,
  subFunctionName: string | null
): string {
  if (!subFunctionName) {
    return `function|${lnodeName}`;
  }

  return `subfunction|${subFunctionName}|${lnodeName}`;
}

function buildGroupBasePath(
  sourceFunctionPath: string,
  subFunctionName: string | null,
  lnodeName: string
): string {
  if (!subFunctionName) {
    return `${sourceFunctionPath}/${lnodeName}`;
  }

  return `${sourceFunctionPath}/${subFunctionName}/${lnodeName}`;
}

function collectLNodeContexts(sourceFunction: Element): LNodeContext[] {
  const contexts: LNodeContext[] = [];

  getChildrenByTagName(sourceFunction, 'LNode').forEach(lnode => {
    contexts.push({ lnode, subFunctionName: null });
  });

  getChildrenByTagName(sourceFunction, 'SubFunction').forEach(subFunction => {
    const subFunctionName = subFunction.getAttribute('name') ?? '';
    getChildrenByTagName(subFunction, 'LNode').forEach(lnode => {
      contexts.push({ lnode, subFunctionName });
    });
  });

  getChildrenByTagName(sourceFunction, 'EqSubFunction').forEach(subFunction => {
    const subFunctionName = subFunction.getAttribute('name') ?? '';
    getChildrenByTagName(subFunction, 'LNode').forEach(lnode => {
      contexts.push({ lnode, subFunctionName });
    });
  });

  return contexts;
}

function buildReferenceItemsForLNode(
  lnode: Element,
  groupKey: string,
  groupLabel: string,
  groupBasePath: string,
  lnodeName: string,
  typeIndexMaps: TypeIndexMaps
): ObjectReferenceItem[] {
  const { doTypeById, daTypeById } = typeIndexMaps;
  const lnClass = lnode.getAttribute('lnClass') ?? '';
  const lnInst = lnode.getAttribute('lnInst') ?? '';
  const lNodeType = getLNodeType(lnode, typeIndexMaps);
  const uniqueItemsByKey = new Map<string, ObjectReferenceItem>();

  if (!lNodeType) return [];

  const lNodeTypeId = lNodeType.getAttribute('id') ?? '';

  getChildrenByTagName(lNodeType, 'DO').forEach(doElement => {
    const doName = doElement.getAttribute('name');
    const doTypeId = doElement.getAttribute('type');
    if (!doName || !doTypeId) return;

    const daPaths = collectDaPathsFromDoType(
      doTypeId,
      [],
      doTypeById,
      daTypeById
    );

    daPaths.forEach(daPath => {
      const shortPath = `${doName}.${daPath}`;
      const fullSource = `${groupBasePath}.${shortPath}`;
      const uniqueKey = `${fullSource}|${lNodeTypeId}`;

      if (uniqueItemsByKey.has(uniqueKey)) return;

      uniqueItemsByKey.set(uniqueKey, {
        id: `${groupKey}|${lNodeTypeId}|${shortPath}`,
        groupKey,
        groupLabel,
        lnodeName,
        lnClass,
        lnInst,
        doName,
        daPath,
        shortPath,
        fullSource,
      });
    });
  });

  return Array.from(uniqueItemsByKey.values());
}

function buildReferenceGroup(
  context: LNodeContext,
  sourceFunctionPath: string,
  typeIndexMaps: TypeIndexMaps
): ObjectReferenceGroup | null {
  const { lnode, subFunctionName } = context;
  const lnodeName = buildLNodeName(lnode);
  const groupLabel = buildGroupLabel(lnodeName, subFunctionName);
  const groupKey = buildGroupKey(lnodeName, subFunctionName);
  const groupBasePath = buildGroupBasePath(
    sourceFunctionPath,
    subFunctionName,
    lnodeName
  );
  const items = buildReferenceItemsForLNode(
    lnode,
    groupKey,
    groupLabel,
    groupBasePath,
    lnodeName,
    typeIndexMaps
  );

  if (!items.length) return null;

  return {
    key: groupKey,
    label: groupLabel,
    items,
  };
}

export function buildObjectReferences(
  sourceFunction: Element,
  doc: Document | Element
): ObjectReferenceGroup[] {
  const dataTypeTemplates = Array.from(
    doc.querySelectorAll(':root > DataTypeTemplates')
  );
  const typeIndexMaps = buildDataTypeTemplateMaps(dataTypeTemplates);
  const sourceFunctionPath = getProcessPath(sourceFunction);
  const lNodeContexts = collectLNodeContexts(sourceFunction);

  return lNodeContexts
    .map(context =>
      buildReferenceGroup(context, sourceFunctionPath, typeIndexMaps)
    )
    .filter(
      (group): group is ObjectReferenceGroup =>
        !!group && group.items.length > 0
    );
}

export function filterObjectReferenceGroups(
  groups: ObjectReferenceGroup[],
  query: string
): ObjectReferenceGroup[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return groups;

  return groups
    .map(group => {
      const groupMatches = group.label.toLowerCase().includes(normalizedQuery);
      if (groupMatches) return group;

      const items = group.items.filter(
        item =>
          item.shortPath.toLowerCase().includes(normalizedQuery) ||
          item.fullSource.toLowerCase().includes(normalizedQuery)
      );

      return {
        ...group,
        items,
      };
    })
    .filter(group => group.items.length > 0);
}

export function buildSourceRefAttributes(
  selectedRef: ObjectReferenceItem
): SourceRefAttributes {
  return {
    source: selectedRef.fullSource,
    input: `${selectedRef.lnClass}${selectedRef.lnInst}.${selectedRef.doName}.${selectedRef.daPath}`,
    pLN: selectedRef.lnClass,
    pDO: selectedRef.doName,
    pDA: selectedRef.daPath,
  };
}

export function selectedReferencesSummary(selectedCount: number): string {
  if (selectedCount === 0) return 'No references selected';
  if (selectedCount === 1) return '1 reference selected';
  return `${selectedCount} references selected`;
}
