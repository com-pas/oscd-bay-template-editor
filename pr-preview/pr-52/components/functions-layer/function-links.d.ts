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
