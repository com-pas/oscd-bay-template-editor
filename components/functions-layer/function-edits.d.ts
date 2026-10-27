import type { EditV2 } from '@openscd/oscd-api';
import { type FunctionData, type SubFunctionData } from '../../util.js';
export interface UpdateFunctionData extends FunctionData {
    functionElement: Element;
}
export interface UpdateFunctionEdits {
    edits: EditV2[];
    newLNodeTypes: Element[];
}
export declare function getInsertReference(parent: Element, tag: string, excluded: Iterable<Element>): Element | null;
export declare function createSubFunctionElement(doc: XMLDocument, tag: string, subFunction: SubFunctionData): Element;
export declare function buildUpdateFunctionEdits(doc: XMLDocument, update: UpdateFunctionData): UpdateFunctionEdits;
