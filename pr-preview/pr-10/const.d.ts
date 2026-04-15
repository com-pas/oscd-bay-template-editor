/** Highlight style shape used for element highlights on the SLD */
export type HighlightStyle = {
    stroke: string;
    strokeWidth: number;
    fill: string;
    opacity?: number;
};
/** PSR element tags that are valid parents for a Function element */
export declare const PSR_TAGS: readonly ["ConductingEquipment", "PowerTransformer", "Bay", "VoltageLevel", "Substation"];
/** Highlight style applied to all selectable PSRs when adding a Function */
export declare const PSR_HIGHLIGHT_STYLE: {
    readonly stroke: "#7821c9";
    readonly strokeWidth: 0.12;
    readonly fill: "none";
};
/** Highlight style applied to the PSR selected as parent of the new Function */
export declare const SELECTED_PSR_HIGHLIGHT_STYLE: {
    readonly stroke: "#7821c9";
    readonly strokeWidth: 0.1;
    readonly fill: "#d3b9ec";
    readonly opacity: 0.5;
};
