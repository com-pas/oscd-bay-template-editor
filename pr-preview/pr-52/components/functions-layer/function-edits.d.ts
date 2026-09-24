import type { EditV2 } from '@openscd/oscd-api';
import { type SubFunctionData } from '../../util.js';
export interface UpdateFunctionData {
    name: string;
    description: string | null;
    type: string | null;
    subfunctions: SubFunctionData[];
    lnodes: Element[];
    functionElement: Element;
}
export interface UpdateFunctionEdits {
    edits: EditV2[];
    newLNodeTypes: Element[];
}
export declare function getLNodeInsertReference(parent: Element, removedLNodes: Element[]): Element | null;
export declare function buildUpdateFunctionEdits(doc: XMLDocument, detail: UpdateFunctionData): UpdateFunctionEdits;
