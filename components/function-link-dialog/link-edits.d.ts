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
export {};
