import { eTr6100Ns, getProcessPath } from '../../util.js';
import type { LinkService } from '../function-link-dialog/object-references.js';

export type FunctionLink = {
  id: string;
  service: LinkService;
  sourceFunction: Element;
  sinkFunction: Element;
  sourceRefs: Element[];
  parallelIndex: number;
  parallelCount: number;
};

export type FunctionBoxGeometry = {
  x: number;
  y: number;
  width: number;
  height: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
};

function isLinkService(service: string | null): service is LinkService {
  return service === 'GOOSE' || service === 'SMV' || service === 'Internal';
}

function getFunctionByPath(doc: Document, path: string): Element | null {
  const segments = path.split('/');
  let current: Element = doc.documentElement;
  for (const seg of segments) {
    const match = Array.from(current.children).find(
      el => el.getAttribute('name') === seg
    );
    if (!match) return null;
    current = match;
  }
  return current.closest('EqFunction, Function');
}

function getSourceFunctionPath(sourceRef: Element): string | null {
  const source = sourceRef.getAttribute('source');
  if (!source) return null;

  return source.split('/').slice(0, -1).join('/');
}

export function buildSourceRefDisplay(sourceRef: Element): string {
  const source = sourceRef.getAttribute('source') ?? '';
  if (!source) return 'Unknown reference';
  return source.split('/').pop() ?? source;
}

export function buildFunctionLinks(
  scope: Element | Document | null,
  doc?: XMLDocument
): FunctionLink[] {
  if (!scope || !doc) return [];

  const sourceRefs = Array.from(scope.querySelectorAll('LNode')).flatMap(
    lnode => Array.from(lnode.getElementsByTagNameNS(eTr6100Ns, 'SourceRef'))
  );

  const directionalLinks = new Map<string, FunctionLink>();

  sourceRefs.forEach(sourceRef => {
    const sinkLNode = sourceRef.closest('LNode');
    if (!sinkLNode) return;

    const sinkFunction = sinkLNode.closest('EqFunction, Function');
    if (!sinkFunction) return;

    const sourcePath = getSourceFunctionPath(sourceRef);
    if (!sourcePath) return;

    const sourceFunction = getFunctionByPath(doc, sourcePath);
    if (!sourceFunction) return;

    const service = sourceRef.getAttribute('service');
    if (!isLinkService(service)) return;

    const sourceFunctionPath = getProcessPath(sourceFunction);
    const sinkFunctionPath = getProcessPath(sinkFunction);

    const directionalKey = `${sourceFunctionPath}|${sinkFunctionPath}|${service}`;
    const existing = directionalLinks.get(directionalKey);

    if (existing) {
      existing.sourceRefs.push(sourceRef);
      return;
    }

    directionalLinks.set(directionalKey, {
      id: directionalKey,
      service,
      sourceFunction,
      sinkFunction,
      sourceRefs: [sourceRef],
      parallelIndex: 0,
      parallelCount: 1,
    });
  });

  const links = Array.from(directionalLinks.values());

  const groupedByPair = new Map<string, FunctionLink[]>();
  links.forEach(link => {
    const sourcePath = getProcessPath(link.sourceFunction);
    const sinkPath = getProcessPath(link.sinkFunction);
    const pairKey = [sourcePath, sinkPath].sort().join('|');
    const group = groupedByPair.get(pairKey) ?? [];
    group.push(link);
    groupedByPair.set(pairKey, group);
  });

  const linksWithParallelOffsets: FunctionLink[] = [];
  groupedByPair.forEach(group => {
    const orderedGroup = [...group].sort((a, b) => a.id.localeCompare(b.id));
    orderedGroup.forEach((link, index) => {
      linksWithParallelOffsets.push({
        ...link,
        parallelIndex: index,
        parallelCount: orderedGroup.length,
      });
    });
  });

  return linksWithParallelOffsets;
}

export function buildFunctionLinkPath(
  sourceBox: FunctionBoxGeometry,
  sinkBox: FunctionBoxGeometry,
  laneOffset = 0
): string {
  const {
    x: sourceX,
    y: sourceY,
    width: sourceWidth,
    left: sourceLeft,
    right: sourceRight,
    top: sourceTop,
  } = sourceBox;
  const { x: sinkX, y: sinkY, left: sinkLeft, right: sinkRight } = sinkBox;

  // When sink and sourec Functions are the same, draw a loop
  if (sourceX === sinkX && sourceY === sinkY) {
    const loopHeight = 1 + Math.abs(laneOffset) * 0.25;
    const loopWidth = Math.max(sourceWidth * 0.85, 2.5);
    const startY = sourceY + laneOffset;
    const topY = sourceTop - loopHeight + laneOffset;
    const rightOuterX = sourceRight + loopWidth * 0.2;
    const leftOuterX = sourceLeft - loopWidth * 0.2;

    return `M ${sourceRight} ${startY} L ${rightOuterX} ${startY} L ${rightOuterX} ${topY} L ${leftOuterX} ${topY} L ${leftOuterX} ${startY} L ${sourceLeft} ${startY}`;
  }

  const sourceOnLeft = sourceX <= sinkX;
  const startX = sourceOnLeft ? sourceRight : sourceLeft;
  const preferredEndX = sourceOnLeft ? sinkLeft : sinkRight;
  const startY = sourceY + laneOffset;
  const endY = sinkY + laneOffset;
  const lanePadding = Math.abs(laneOffset) * 0.5;
  const horizontalGap = Math.abs(preferredEndX - startX);

  if (sourceOnLeft && startX <= preferredEndX) {
    const elbowX = startX + Math.max(0.8 + lanePadding, horizontalGap / 2);
    return `M ${startX} ${startY} L ${elbowX} ${startY} L ${elbowX} ${endY} L ${preferredEndX} ${endY}`;
  }

  if (!sourceOnLeft && startX >= preferredEndX) {
    const elbowX = startX - Math.max(0.8 + lanePadding, horizontalGap / 2);
    return `M ${startX} ${startY} L ${elbowX} ${startY} L ${elbowX} ${endY} L ${preferredEndX} ${endY}`;
  }

  if (sourceOnLeft) {
    const outerX = Math.max(sourceRight, sinkRight) + 1.2 + lanePadding;
    const endX = sinkRight;
    return `M ${startX} ${startY} L ${outerX} ${startY} L ${outerX} ${endY} L ${endX} ${endY}`;
  }

  const outerX = Math.min(sourceLeft, sinkLeft) - 1.2 - lanePadding;
  const endX = sinkLeft;
  return `M ${startX} ${startY} L ${outerX} ${startY} L ${outerX} ${endY} L ${endX} ${endY}`;
}
