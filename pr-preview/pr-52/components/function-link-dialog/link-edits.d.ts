import type { EditV2 } from '@openscd/oscd-api';
import { type LinkService, type ObjectReferenceItem } from './object-references.js';
interface BuildFunctionLinkEditsParams {
    doc: XMLDocument;
    sinkLNode: Element;
    selectedReferences: ObjectReferenceItem[];
    service: LinkService;
    namespacePrefix: string;
}
export declare function buildFunctionLinkEdits({ doc, sinkLNode, selectedReferences, service, namespacePrefix, }: BuildFunctionLinkEditsParams): EditV2[];
export declare function buildRemoveSourceRefEdits(sourceRefsToRemove: Element[]): EditV2[];
/**
 * Removes the SourceRefs elsewhere in the document that point at any of
 * `lnodes`. All removals are grouped per container in one pass, so a
 * LNodeInputs/Private that loses every SourceRef is removed as a whole even
 * when those SourceRefs pointed at different removed LNodes. SourceRefs inside
 * `removedElements` are skipped, as they disappear with those elements.
 */
export declare function buildRemoveSourceRefsToLNodesEdits(lnodes: Element[], removedElements?: Iterable<Element>): EditV2[];
export {};
