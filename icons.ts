import { html, nothing, svg, TemplateResult } from 'lit';
import {
  EqType,
  eqTypes,
  isEqType,
  ringedEqTypes,
  singleTerminal,
} from './util.js';

const voltageLevelPath = svg`<path
    d="M 4 4 L 12.5 21 L 21 4"
    fill="none"
    stroke="currentColor"
    stroke-width="3"
    stroke-linejoin="round"
    stroke-linecap="round"
  />`;

const bayPath = svg`<path
    d="M 3 2 L 22 2"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linejoin="round"
    stroke-linecap="round"
  />
  <path
    d="M 3 5 L 22 5"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linejoin="round"
    stroke-linecap="round"
  />
  <path
    d="M 7 2 L 7 7.5"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linejoin="round"
    stroke-linecap="round"
  />
  <path
    d="M 18 5 L 18 7.5"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linejoin="round"
    stroke-linecap="round"
  />
  <path
    d="M 5.5 8.5 L 7 11 L 7 13 L 18 13 L 18 11 L 16.5 8.5"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linejoin="round"
    stroke-linecap="round"
  />
  <path
    d="M 12.5 13 L 12.5 15"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linejoin="round"
    stroke-linecap="round"
  />
  <path
    d="M 11 16 L 12.5 18.5 L 12.5 23"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linejoin="round"
    stroke-linecap="round"
  />
  <path
    d="M 10.5 21 L 12.5 23 L 14.5 21"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linejoin="round"
    stroke-linecap="round"
  />`;

const functionsPath = svg`<path
    d="M240-160v-80l260-240-260-240v-80h480v120H431l215 200-215 200h289v120H240Z"
    fill="currentColor"
  />`;

const functionsOffPath = svg`<path
    d="M240-160v-80l260-240-260-240v-80h480v120H431l215 200-215 200h289v120H240Z"
    fill="currentColor"
  />
  <path
    d="M160-800L800-160"
    fill="none"
    stroke="currentColor"
    stroke-width="80"
    stroke-linecap="round"
  />`;

const ptr1WAPath = svg`
  <circle fill="none" cx="1.5" cy="1.5" r="0.7"/>
  <path fill="none" d="M 1.5 0.8 C 0.5 0.8, 0.4 1.3, 0.3 1.5"/>
`;

const ptr2WAPath = svg`
  <circle fill="none" cx="1.5" cy="1.5" r="0.7"/>
  <path fill="none" d="M 1.5 0.8 C 0.5 0.8, 0.4 1.3, 0.3 1.5"/>
  <circle fill="none" cx="1.5" cy="2.5" r="0.7"/>
`;

const ptr1WPath = svg`
  <circle fill="none" cx="1.5" cy="1.5" r="0.7"/>
`;

const ptr2WPath = svg`
  <circle fill="none" cx="1.5" cy="1.5" r="0.7"/>
  <circle fill="none" cx="1.5" cy="2.5" r="0.7"/>
`;

const ptr3WPath = svg`
  <circle fill="none" cx="1.5" cy="1.5" r="0.7"/>
  <circle fill="none" cx="2" cy="2.5" r="0.7"/>
  <circle fill="none" cx="1" cy="2.5" r="0.7"/>
`;

const zigPath = svg`
  <line x1="1.5" y1="1.5" x2="1.5" y2="1.25" />
  <line transform="rotate(240 1.5 1.25)" x1="1.5" y1="1.5" x2="1.5" y2="1.25" />
`;

export const zigZagPath = svg`
<g>${zigPath}</g>
<g transform="rotate(120 1.5 1.5)">${zigPath}</g>
<g transform="rotate(240 1.5 1.5)">${zigPath}</g>
`;

export const zigZag2WTransform =
  'matrix(0.8, 0, 0, 0.8, 0.3, 0.3) translate(0 -0.1) rotate(-20 1.5 1.5)';

export function ptrIcon(
  windings: 1 | 2 | 3,
  {
    slot = '',
    kind = 'default',
  }: { slot?: string; kind?: 'default' | 'auto' | 'earthing' } = {}
) {
  let path = svg``;
  if (windings === 3) path = ptr3WPath;
  else if (windings === 2) {
    if (kind === 'auto') path = ptr2WAPath;
    else path = ptr2WPath;
  } else if (windings === 1) {
    if (kind === 'auto') path = ptr1WAPath;
    else path = ptr1WPath;
  }
  const zigZag =
    kind === 'earthing'
      ? svg`<g transform="${
          windings > 1 ? zigZag2WTransform : nothing
        }">${zigZagPath}</g>`
      : nothing;
  return html`<svg
    viewBox="0.3 0.5 2.4 ${windings > 1 ? 3 : 2}"
    width="24"
    height="24"
    stroke="currentColor"
    stroke-width="${windings > 1 ? 0.14 : 0.11}"
    stroke-linecap="round"
    ${slot ? html`slot="${slot}"` : nothing}
  >
    ${path} ${zigZag}
  </svg>`;
}

export const voltageLevelIcon = html`<svg
  viewBox="0 0 25 25"
  width="24"
  height="24"
>
  ${voltageLevelPath}
</svg>`;

export const voltageLevelGraphic = html`<svg
  viewBox="0 0 25 25"
  width="24"
  height="24"
  slot="graphic"
>
  ${voltageLevelPath}
</svg>`;

export const bayIcon = html`<svg viewBox="0 0 25 25" width="24" height="24">
  ${bayPath}
</svg>`;

export const bayGraphic = html`<svg
  viewBox="0 0 25 25"
  width="24"
  height="24"
  slot="graphic"
>
  ${bayPath}
</svg>`;

export const functionsIcon = html`<svg
  viewBox="0 -960 960 960"
  width="24"
  height="24"
>
  ${functionsPath}
</svg>`;

export const functionsOffIcon = html`<svg
  viewBox="0 -960 960 960"
  width="24"
  height="24"
>
  ${functionsOffPath}
</svg>`;

const equipmentPaths: Record<EqType, TemplateResult<2>> = {
  CAB: svg`
  <path
    d="M 9.4,4.2 H 15.6 L 12.5,8.3 Z"
    fill="currentColor"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    />
  <path
    d="m 12.5,8.3 v 9"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    />
  <path
    d="m 9.4,21.3 h 6.2 l -3.1,-4.1 z"
    fill="currentColor"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    />
  `,
  CAP: svg`
  <path
    d="M 6.5,10.1 H 18.5"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    />
  <path
    d="M 12.5,4 V 10.1"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    />
  <path
    d="M 6.5,14.9 H 18.5"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    />
  <path
    d="M 12.5,14.9 V 21"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    />
  `,
  CBR: svg`
  <line
    x1="12.5"
    y1="21"
    x2="4"
    y2="5"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
  />
  <line
    x1="9.5"
    y1="1"
    x2="15.5"
    y2="7"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
  />
  <line
    x1="9.5"
    y1="7"
    x2="15.5"
    y2="1"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
  />
  `,
  CTR: svg`
  <line
    x1="12.5"
    y1="4"
    x2="12.5"
    y2="21"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
  />
  <circle
    cx="12.5"
    cy="12.5"
    r="7.5"
    stroke="currentColor"
    fill="none"
    stroke-width="1.5"
    stroke-linecap="round"
  />
  `,
  DIS: svg`
  <path
    d="M 12.5 21 L 4 4"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
  />
  <path
    d="M 8 4 L 17 4"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
  />
  `,
  GEN: svg`
  <path
    d="m 16.2,12.5 v 4.2 q -0.2,0.2 -0.6,0.6 -0.4,0.4 -1.1,0.7 -0.7,0.3 -1.8,0.3 -1.8,0 -2.9,-1.2 -1.1,-1.2 -1.1,-3.6 v -2.1 q 0,-2.4 1,-3.6 1,-1.1 2.9,-1.1 1.7,0 2.6,0.9 0.9,0.9 1,2.6 h -1.4 q -0.1,-1.1 -0.6,-1.6 -0.5,-0.6 -1.5,-0.6 -1.3,0 -1.8,0.9 -0.5,0.9 -0.5,2.6 v 2.1 q 0,1.8 0.7,2.7 0.7,0.9 1.9,0.9 1,0 1.4,-0.3 0.4,-0.3 0.6,-0.5 v -2.6 h -2.1 v -1.2 z"
    stroke="currentColor"
    fill="currentColor"
    stroke-width="0.3"
    stroke-linecap="round"
  />
  `,
  IFL: svg`
  <polygon
    points="4,4 12.5,21 21,4"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linejoin="round"
    stroke-linecap="round"
  />
  `,
  LIN: svg`
  <path
    d="M 12.5,4 V 21"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
  />
  <path
    d="m 10.3,12.5 4.3,-2.5"
    fill="currentColor"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
  />
  <path
    d="m 10.3,15 4.3,-2.5"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
  />
  `,
  MOT: svg`
  <path
    d="m 12.5,15.5 2.3,-7.8 h 1.4 v 9.6 h -1.1 v -3.7 l 0.1,-3.7 -2.3,7.4 h -0.9 L 9.8,9.8 9.9,13.6 v 3.7 H 8.8 V 7.7 h 1.4 z"
    stroke="currentColor"
    fill="currentColor"
    stroke-width="0.3"
    stroke-linecap="round"
  />
  `,
  REA: svg`
  <path
    d="m 4.5,12.5 h 8 V 4"
    stroke="currentColor"
    fill="none"
    stroke-width="1.5"
    stroke-linecap="round"
  />
  <path
    d="m 4.5,12.5 a 8,8 0 0 1 8,-8 8,8 0 0 1 8,8 8,8 0 0 1 -8,8"
    stroke="currentColor"
    fill="none"
    stroke-width="1.5"
    stroke-linecap="round"
  />
  <path
    d="M 12.5,20.5 V 21"
    stroke="currentColor"
    fill="none"
    stroke-width="1.5"
    stroke-linecap="round"
  />
  `,
  RES: svg`
  <rect
    y="4"
    x="8.5"
    height="17"
    width="8"
    stroke="currentColor"
    fill="none"
    stroke-width="1.5"
    stroke-linecap="round"
  />
  `,
  SAR: svg`
  <path
    d="M 12.5,4 V 8"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    />
  <path
    d="m 12.5,21 v 4"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
  />
  <line
    x1="10"
    y1="24.25"
    x2="15"
    y2="24.25"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
  />
  <path
    d="M 11.2,8 12.5,11 13.8,8 Z"
    fill="currentColor"
    stroke="currentColor"
    stroke-width="1"
    stroke-linecap="round"
  />
  <rect
    y="4"
    x="8.5"
    height="17"
    width="8"
    stroke="currentColor"
    fill="none"
    stroke-width="1.5"
    stroke-linecap="round"
  />
  `,
  SMC: svg`
  <path
    d="m 16.6,12.5 c -0.7,1.4 -1.3,2.8 -2.1,2.8 -1.5,0 -2.6,-5.6 -4.1,-5.6 -0.7,0 -1.4,1.4 -2.1,2.8"
    stroke="currentColor"
    fill="none"
    stroke-width="1.2"
    stroke-linecap="round"
  />
  `,
  VTR: svg`
  <circle
    cx="12.5"
    cy="9.5"
    r="5.25"
    stroke="currentColor"
    fill="none"
    stroke-width="1.5"
    stroke-linecap="round"
  />
  <circle
    cx="12.5"
    cy="15.5"
    r="5.25"
    stroke="currentColor"
    fill="none"
    stroke-width="1.5"
    stroke-linecap="round"
  />
`,
};

export const eqRingPath = svg`
  <circle
    cx="12.5"
    cy="12.5"
    r="8.5"
    stroke="currentColor"
    fill="none"
    stroke-width="1.5"
    stroke-linecap="round"
  />
  `;

const defaultEquipmentPath = svg`
  <circle
    cx="12.5"
    cy="12.5"
    r="11"
    stroke-width="1.5"
    stroke="currentColor"
    fill="none"
  />
  <path
    d=" M 7.5 17.5
    L 12 13
    Z"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linejoin="round"
    stroke-linecap="round"
  />
  <path
    d="	M 11 7
      L 10 8
      C 5 13, 11 20, 17 15
      L 18 14
      Z"
    fill="currentColor"
    stroke="currentColor"
    stroke-linejoin="round"
  />
  <path
    d=" M 13 9
    L 16 6
    Z"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linejoin="round"
    stroke-linecap="round"
  />
  <path
    d=" M 16 12
    L 19 9
    Z"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linejoin="round"
    stroke-linecap="round"
  />
`;

export function equipmentPath(equipmentType: string | null): TemplateResult<2> {
  if (equipmentType && isEqType(equipmentType))
    return equipmentPaths[equipmentType]!;
  return defaultEquipmentPath;
}

export function equipmentGraphic(
  equipmentType: string | null
): TemplateResult<1> {
  return html`<svg viewBox="0 0 25 25" width="24" height="24" slot="graphic">
    <line
      x1="12.5"
      y1="0"
      x2="12.5"
      y2="4"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
    />
    ${!equipmentType || !singleTerminal.has(equipmentType)
      ? svg`<line
      x1="12.5"
      y1="21"
      x2="12.5"
      y2="25"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
    />`
      : nothing}
    ${equipmentPath(equipmentType)}
    ${equipmentType && ringedEqTypes.has(equipmentType) ? eqRingPath : nothing}
  </svg>`;
}

export function equipmentIcon(equipmentType: string): TemplateResult<1> {
  return html`<svg viewBox="0 0 25 25" width="24" height="24">
    <line
      x1="12.5"
      y1="0"
      x2="12.5"
      y2="4"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
    />
    ${!singleTerminal.has(equipmentType)
      ? svg`<line
      x1="12.5"
      y1="21"
      x2="12.5"
      y2="25"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
    />`
      : nothing}
    ${equipmentPath(equipmentType)}
    ${ringedEqTypes.has(equipmentType) ? eqRingPath : nothing}
  </svg>`;
}

function equipmentSymbol(equipmentType: string): TemplateResult<2> {
  return svg`<symbol
    id="${equipmentType}"
    viewBox="0 0 25 25"
    width="1" height="1"
  >
    ${equipmentPath(equipmentType)}
  </symbol>`;
}

const groundedMarker = svg`<marker
  markerWidth="20" markerHeight="20"
  refX="12.5" refY="12.5"
  viewBox="0 0 25 25"
  id="grounded"
  orient="auto-start-reverse"
>
  <line
    y1="17"
    y2="8"
    x1="12.5"
    x2="12.5"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-width="1.5"
  />
  <line
    y1="15.5"
    y2="9.5"
    x1="14.7"
    x2="14.7"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-width="1.5"
  />
  <line
    y1="14.5"
    y2="10.5"
    x1="16.8"
    x2="16.8"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-width="1.5"
  />
</marker>`;

const arrowMarker = svg`
<marker
  id="arrow"
  viewBox="0 0 10 10"
  refX="5"
  refY="5"
  markerWidth="6"
  markerHeight="6"
  orient="auto-start-reverse">
  <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
</marker>
`;

export const symbols = svg`
  <defs>
  <pattern id="halfgrid" patternUnits="userSpaceOnUse" width="1" height="1" viewBox="0 0 1 1">
  <circle cx="0.1" cy="0.25" r="0.035" fill="#888" opacity="0.3" />
  <circle cx="0.6" cy="0.25" r="0.035" fill="#888" opacity="0.3" />
  <circle cx="0.1" cy="0.75" r="0.035" fill="#888" opacity="0.3" />
  <circle cx="0.6" cy="0.75" r="0.035" fill="#888" opacity="0.3" />
  </pattern>
  <pattern id="grid" patternUnits="userSpaceOnUse" width="1" height="1" viewBox="0 0 1 1">
  <line x1="0" y1="0" x2="0" y2="1" stroke="#888" stroke-opacity="0.3" stroke-width="0.06" />
  <line x1="0" y1="0" x2="1" y2="0" stroke="#888" stroke-opacity="0.3" stroke-width="0.06" />
  <line x1="1" y1="0" x2="1" y2="1" stroke="#888" stroke-opacity="0.3" stroke-width="0.06" />
  <line x1="0" y1="1" x2="1" y2="1" stroke="#888" stroke-opacity="0.3" stroke-width="0.06" />
  </pattern>
  ${eqTypes.map(eqType => equipmentSymbol(eqType))}
  ${equipmentSymbol('ConductingEquipment')}
  ${groundedMarker}
  ${arrowMarker}
  </defs>
`;

export const functionPath = svg`
  <path d="M400-240v-80h62l105-120-105-120h-66l-64 344q-8 45-37 70.5T221-120q-45 0-73-24t-28-64q0-32 17-51.5t43-19.5q25 0 42.5 17t17.5 41q0 5-.5 9t-1.5 9q5-1 8.5-5.5T252-221l62-339H200v-80h129l21-114q7-38 37.5-62t72.5-24q44 0 72 26t28 65q0 30-17 49.5T500-680q-25 0-42.5-17T440-739q0-5 .5-9t1.5-9q-6 2-9 6t-5 12l-17 99h189v80h-32l52 59 52-59h-32v-80h200v80h-62L673-440l105 120h62v80H640v-80h32l-52-60-52 60h32v80H400Z" fill="currentColor"/>
`;

export const functionAddIcon = html`<svg
  viewBox="0 -960 1200 960"
  width="24"
  height="24"
>
  <g>
    <rect x="120" y="-680" width="80" height="320" fill="currentColor" />
    <rect x="0" y="-560" width="320" height="80" fill="currentColor" />
  </g>
  <g transform="translate(320,0)">${functionPath}</g>
</svg>`;
