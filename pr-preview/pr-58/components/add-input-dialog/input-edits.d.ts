import type { EditV2 } from '@openscd/oscd-api';
import type { SaveInputDetail } from './add-input-dialog.js';
interface BuildInputEditsParams extends Omit<SaveInputDetail, 'context'> {
    doc: XMLDocument;
    sinkLNode: Element;
}
export declare function getBayProcessResources(bay: Element): Element[];
export declare function buildInputEdits({ doc, sinkLNode, resourceName, description, sourceClass, dataObject, dataAttribute, inputName, }: BuildInputEditsParams): EditV2[];
export {};
