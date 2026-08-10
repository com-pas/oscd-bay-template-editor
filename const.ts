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

/** Highlight style applied to the Function when selecting a source for Link */
export const SOURCE_CANDIDATE_HIGHLIGHT_STYLE = {
  stroke: '#1a7f37',
  fill: '#d9f2e3',
} as const;

/** Colours associated with each LinkService type */
export const LINK_SERVICE_COLORS = {
  GOOSE: '#2e7d32',
  SMV: '#c62828',
  Internal: '#1565c0',
};
