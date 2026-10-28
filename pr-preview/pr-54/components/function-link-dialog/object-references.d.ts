export type LinkService = 'GOOSE' | 'SMV' | 'Internal';
export interface ObjectReferenceItem {
    id: string;
    groupKey: string;
    groupLabel: string;
    lnodeName: string;
    lnClass: string;
    lnInst: string;
    doName: string;
    daPath: string;
    shortPath: string;
    fullSource: string;
}
export interface ObjectReferenceGroup {
    key: string;
    label: string;
    items: ObjectReferenceItem[];
}
export interface SourceRefAttributes {
    source: string;
    input: string;
    pLN: string;
    pDO: string;
    pDA: string;
}
export declare function buildObjectReferences(sourceFunction: Element, doc: Document | Element): ObjectReferenceGroup[];
export declare function filterObjectReferenceGroups(groups: ObjectReferenceGroup[], query: string): ObjectReferenceGroup[];
export declare function buildSourceRefAttributes(selectedRef: ObjectReferenceItem): SourceRefAttributes;
export declare function selectedReferencesSummary(selectedCount: number): string;
