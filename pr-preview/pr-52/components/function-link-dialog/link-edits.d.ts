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
/** Finds all SourceRef elements anywhere in the document whose `source` points at `lnode`. */
export declare function findSourceRefsPointingToLNode(lnode: Element): Element[];
/** Whether `lnode` is a sink of information (has its own LNodeInputs/SourceRef). */
export declare function isLNodeSink(lnode: Element): boolean;
/** Whether `lnode` is used as a source and/or sink in any existing function link. */
export declare function lNodeHasLinks(lnode: Element): boolean;
/**
 * Builds edits to remove `lnode` itself and, for any SourceRef elsewhere in the
 * document pointing at it, removes those SourceRef elements (or their containing
 * LNodeInputs/Private, if that container would otherwise become empty).
 */
export declare function buildRemoveLNodeEdits(lnode: Element): EditV2[];
export {};
