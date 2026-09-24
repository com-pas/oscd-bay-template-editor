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
/** Highlight style applied to the Function when selecting a source for Link */
export declare const SOURCE_CANDIDATE_HIGHLIGHT_STYLE: {
    readonly stroke: "#1a7f37";
    readonly fill: "#d9f2e3";
};
/** Colours associated with each LinkService type */
export declare const LINK_SERVICE_COLORS: {
    GOOSE: string;
    SMV: string;
    Internal: string;
};
/** Confirmation shown before removing an LNode that takes part in a function link */
export declare const REMOVE_LINKED_LNODE_CONFIRMATION: {
    readonly headline: "Delete LNode?";
    readonly description: "This LNode is used as a source and/or sink in an existing function link. Deleting it will remove the associated link(s). Are you sure you want to continue?";
    readonly icon: "warning";
    readonly variant: "danger";
    readonly confirmLabel: "Delete";
    readonly cancelLabel: "Cancel";
};
