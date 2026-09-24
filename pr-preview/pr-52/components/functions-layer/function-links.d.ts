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
export declare function buildSourceRefDisplay(sourceRef: Element): string;
export declare function buildSourceRefKey(sourceRef: Element): string;
export declare function buildFunctionLinks(scope: Element | Document | null, doc?: XMLDocument): FunctionLink[];
export declare function buildFunctionLinkPath(sourceBox: FunctionBoxGeometry, sinkBox: FunctionBoxGeometry, laneOffset?: number): string;
/**
 * Finds all SourceRef elements anywhere in the document whose `source` points
 * at one of `lnodes`. Scans the document's SourceRefs once, however many
 * LNodes are passed.
 */
export declare function findSourceRefsPointingToLNodes(lnodes: Element[]): Element[];
/** Finds all SourceRef elements anywhere in the document whose `source` points at `lnode`. */
export declare function findSourceRefsPointingToLNode(lnode: Element): Element[];
/** Whether `lnode` is a sink of information (has its own LNodeInputs/SourceRef). */
export declare function isLNodeSink(lnode: Element): boolean;
/**
 * Whether `lnode` is used as a source and/or sink in any existing function
 * link. Always false for an LNodeType, i.e. an LNode not created yet.
 */
export declare function lNodeHasLinks(lnode: Element): boolean;
