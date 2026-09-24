import { EditV2 } from '@openscd/oscd-api';
export declare const privType = "OpenSCD-SLD-Layout";
export declare const sldNs = "https://openscd.org/SCL/SSD/SLD/v0";
export declare const xmlnsNs = "http://www.w3.org/2000/xmlns/";
export declare const eTr6100Ns = "http://www.iec.ch/61850/2019/SCL/6-100";
export declare const eTr6100NsPrefix = "eTr_6-100";
export declare const eTr6100PrivType = "eIEC61850-6-100";
export declare const svgNs = "http://www.w3.org/2000/svg";
export declare const xlinkNs = "http://www.w3.org/1999/xlink";
export declare const eqTypes: readonly ["CAB", "CAP", "CBR", "CTR", "DIS", "GEN", "IFL", "LIN", "MOT", "REA", "RES", "SAR", "SMC", "VTR"];
export type EqType = (typeof eqTypes)[number];
export declare function isEqType(str: string): str is EqType;
export declare const ringedEqTypes: Set<string>;
export declare const singleTerminal: Set<string>;
interface FunctionBaseData {
    name: string;
    description: string | null;
    type: string | null;
    lnodes: Element[];
}
export interface SubFunctionData extends FunctionBaseData {
    /** UI-only key, stable across renames. Never written to the SCL. */
    id: string;
    /** Present if and only if the SubFunction already exists in the document. */
    element?: Element | null;
}
export interface FunctionData extends FunctionBaseData {
    subFunctions: SubFunctionData[];
}
export declare function getChildrenByTagName(parent: Element, tagName: string): Element[];
/** Whether `element` is, or is a descendant of, one of `ancestors`. */
export declare function isInsideAny(element: Element, ancestors: ReadonlySet<Element>): boolean;
/** Whether an entry of `FunctionData.lnodes` is an LNode still to be created. */
export declare function isLNodeType(element: Element): boolean;
/** Reads an existing (Eq)SubFunction into the form data used by the dialogs. */
export declare function subFunctionDataFromElement(element: Element): SubFunctionData;
export declare function lNodeTypeClass(lNodeType: Element): string;
export declare function lNodeTypeDesc(lNodeType: Element): string | null;
export declare function lNodeTypeId(lNodeType: Element): string;
export declare function createLNodeFromType(doc: XMLDocument, lNodeType: Element): Element;
export declare function uniqueLNodeTypes(lNodeTypes: Element[]): Element[];
export declare function setSLDAttributes(element: Element, nsPrefix: string, values: Record<string, string>): void;
export declare function getSLDAttributes(element: Element, key: string): string | null;
export declare function updateSLDAttributes(element: Element, nsPrefix: string, values: Partial<Record<string, string | null>>): EditV2;
export declare function busSections(element: Element): Element[];
export declare function isBusBar(element: Element): boolean;
export declare function makeBusBar(doc: XMLDocument, nsp: string): Element;
export declare function uniqueName(element: Element, parent: Element): string;
/**
 * Calculates coordinates for a new Function element.
 * - Centers in substation for Bay/VoltageLevel parents.
 * - Otherwise, places below parent or sibling with coordinates, or centers in substation as fallback.
 * - Avoids stacking by offsetting if position is occupied.
 * @param doc XMLDocument containing the SCL structure
 * @param parent Parent element under which the function is created
 * @returns { x, y } coordinates for the new function
 */
export declare function getFunctionCoordinates(doc: XMLDocument, parent: Element): {
    x: number;
    y: number;
};
export declare function getProcessPath(element: Element): string;
/** The name an LNode is referred to by in SourceRef paths, e.g. `XCBR1`. */
export declare function getLNodeName(lnode: Element): string;
/**
 * The path a SourceRef `source` starts with when it points at `lnode`, e.g.
 * `S1/V1/B1/F1/SF1/XCBR1`. Null if `lnode` is not inside an (Eq)Function.
 */
export declare function getLNodeSourcePath(lnode: Element): string | null;
export declare function createPowerSystemRelationPrivate(doc: XMLDocument, path: string): Element;
/**
 * Returns Function elements associated with a given SCL element.
 *
 * - For Bay, VoltageLevel, Substation: returns direct child Function elements
 *   that have no PowerSystemRelation private (i.e. not linked to specific equipment).
 * - For ConductingEquipment, PowerTransformer and TransformerWinding:
 *  returns direct child EqFunction elements.
 */
export declare function getFunctions(element: Element): Element[];
/**
 * Returns all SLD SVG canvases from sld-editor, one per Substations
 *
 * WORKAROUND: relies on internal shadow DOM structure.
 */
export declare function getSldSvgs(sldEditor: Element): SVGSVGElement[];
/**
 * Highlights busbars in the SLD editor by directly manipulating the SVG DOM.
 * WORKAROUND: The sld-editor doesn't properly highlight busbars.
 *
 * @param sldEditor The sld-editor element
 * @param busbars Array of Bay elements that are busbars
 * @param highlightStyle The style to apply to busbar highlights
 */
export declare function highlightBusbars(sldEditor: Element, busbars: Element[], highlightStyle: {
    stroke: string;
    strokeWidth: number;
    fill: string;
    opacity?: number;
}): void;
/**
 * Removes busbar highlights applied by highlightBusbars.
 *
 * @param sldEditor The sld-editor element
 */
export declare function clearBusbarHighlights(sldEditor: Element): void;
export {};
