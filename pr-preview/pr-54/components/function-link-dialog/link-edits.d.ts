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
 * Removes the SourceRefs pointing to the specified LNodes, except those inside removed elements.
 */
export declare function buildRemoveSourceRefsToLNodesEdits(lnodes: Element[], removedElements?: Iterable<Element>): EditV2[];
export {};
