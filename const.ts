/** Highlight style shape used for element highlights on the SLD */
export type HighlightStyle = {
  stroke: string;
  strokeWidth: number;
  fill: string;
  opacity?: number;
};

/** PSR element tags that are valid parents for a Function element */
export const PSR_TAGS = [
  'ConductingEquipment',
  'PowerTransformer',
  'Bay',
  'VoltageLevel',
  'Substation',
] as const;

/** Highlight style applied to all selectable PSRs when adding a Function */
export const PSR_HIGHLIGHT_STYLE = {
  stroke: '#7821c9',
  strokeWidth: 0.12,
  fill: 'none',
} as const;

/** Highlight style applied to the PSR selected as parent of the new Function */
export const SELECTED_PSR_HIGHLIGHT_STYLE = {
  stroke: '#7821c9',
  strokeWidth: 0.1,
  fill: '#d3b9ec',
  opacity: 0.5,
} as const;
