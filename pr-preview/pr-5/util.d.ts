import { EditV2 } from '@openscd/oscd-api';
export declare const privType = "OpenSCD-SLD-Layout";
export declare const sldNs = "https://openscd.org/SCL/SSD/SLD/v0";
export declare const xmlnsNs = "http://www.w3.org/2000/xmlns/";
export declare const svgNs = "http://www.w3.org/2000/svg";
export declare const xlinkNs = "http://www.w3.org/1999/xlink";
export declare const eqTypes: readonly ["CAB", "CAP", "CBR", "CTR", "DIS", "GEN", "IFL", "LIN", "MOT", "REA", "RES", "SAR", "SMC", "VTR"];
export type EqType = (typeof eqTypes)[number];
export declare function isEqType(str: string): str is EqType;
export declare const ringedEqTypes: Set<string>;
export declare const singleTerminal: Set<string>;
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
