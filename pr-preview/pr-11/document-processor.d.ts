export interface ProcessedFunction {
    element: Element;
    name: string;
    x: number;
    y: number;
    parent: Element | null;
    referencedElement: Element | null;
    relationPath: string | null;
}
export interface ProcessedDocument {
    substations: Element[];
    functionMap: Map<Element, ProcessedFunction[]>;
    functionsByElement: Map<Element, ProcessedFunction>;
    allFunctions: ProcessedFunction[];
    psrElements: Element[];
    hasVoltageLevelOrTransformer: boolean;
    hasFunctions: boolean;
    hasSubstation: boolean;
    hasNonBusBarBays: boolean;
    hasVoltageLevel: boolean;
}
export declare class DocumentProcessor {
    /**
     * Processes an XML document and returns structured data with function mappings.
     *
     * @param doc The SCL document to process
     * @param substation Optional: process only a specific substation. If omitted, processes entire document.
     * @returns ProcessedDocument containing substations, functionMap, and functionsByElement
     */
    static process(doc: XMLDocument, substation?: Element): ProcessedDocument;
    /**
     * Extracts all Function elements with valid SLD coordinates.
     * Resolves PowerSystemRelation references if present.
     *
     * @param doc The SCL document
     * @param substation Optional: scope to a specific substation
     * @returns Array of ProcessedFunction objects
     */
    private static extractFunctions;
    /**
     * Resolves a process path string (e.g., "S1/VL1/Bay1/QA1") to the actual Element.
     *
     * @param doc The SCL document
     * @param path Process path string (format: Substation/VoltageLevel/Bay/Equipment)
     * @returns Resolved Element or null if not found
     */
    private static resolveProcessPath;
    /**
     * Builds a Map from SCL elements to their associated functions.
     *
     * A function is associated with an element if:
     * 1. The element is the function's direct DOM parent (Bay/VoltageLevel/Substation), OR
     * 2. The function has a PowerSystemRelation referencing the element (ConductingEquipment/PowerTransformer)
     *
     * This matches the behavior of util.getFunctions() but computed once for all elements.
     *
     * @param allFunctions All processed functions
     * @returns Map<Element, ProcessedFunction[]>
     */
    private static buildFunctionMap;
}
