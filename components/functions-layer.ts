/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { LitElement, html, css, svg, TemplateResult, nothing } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { createRef, Ref, ref } from 'lit/directives/ref.js';
import { newEditEventV2 } from '@openscd/oscd-api/utils.js';
import { getSLDAttributes, updateSLDAttributes } from '../util.js';
import '@material/mwc-icon';

type Point = [number, number];

type FunctionData = {
  element: Element;
  name: string;
  x: number;
  y: number;
  parent?: Element | null;
};

type BayBoundaries = {
  x: number;
  y: number;
  w: number;
  h: number;
};

@customElement('functions-layer')
export class FunctionsLayer extends LitElement {
  private readonly FUNCTION_BOX = {
    HEIGHT: 1,
    ICON_SIZE: 0.8,
    ICON_WIDTH: 0.8,
    FONT_SIZE: 0.5,
    CHAR_WIDTH: 0.28,
    PADDING: 0.4,
    SPACING: 0.2,
    MIN_WIDTH: 2,
    BORDER_RADIUS: 0.15,
    STROKE_WIDTH: 0.04,
  } as const;

  private readonly FUNCTION_COLORS = {
    NORMAL_FILL: 'white',
    PREVIEW_FILL: 'rgba(33, 150, 243, 0.1)',
    PREVIEW_STROKE: '#2196f3',
    STROKE: 'currentColor',
  } as const;

  @property({ attribute: false })
  doc?: XMLDocument;

  @property({ type: Number })
  editCount: number = -1;

  @property({ type: Number })
  gridSize: number = 24;

  @property({ type: Boolean })
  disabled: boolean = false;

  @property({ type: String })
  nsp: string = 'eosld';

  @property({ attribute: false })
  placing?: Element;

  @property({ attribute: false })
  placingOffset: Point = [0, 0];

  @property({ attribute: false })
  onStartPlaceFunction?: (element: Element, offset: Point) => void;

  @state()
  private functions: FunctionData[] = [];

  @state()
  private mouseX = 0;

  @state()
  private mouseY = 0;

  @state()
  private sldOffsetTop = 0;

  @state()
  private sldOffsetLeft = 0;

  @query('svg')
  svg!: SVGSVGElement;

  coordinatesRef: Ref<HTMLElement> = createRef();

  private calculateSldOffset() {
    const parent = this.parentElement;
    if (!parent) return;

    const sldEditor = parent.querySelector('sld-editor');
    if (!sldEditor) return;

    const substationEditor = sldEditor.shadowRoot?.querySelector(
      'sld-substation-editor'
    );
    if (!substationEditor) return;

    const sldSvg = substationEditor.shadowRoot?.querySelector(
      'svg#sld'
    ) as SVGSVGElement;
    if (sldSvg) {
      const sldRect = sldSvg.getBoundingClientRect();
      const hostRect = this.getBoundingClientRect();
      this.sldOffsetTop = sldRect.top - hostRect.top;
      this.sldOffsetLeft = sldRect.left - hostRect.left;
    }
  }

  firstUpdated() {
    this.calculateSldOffset();
    window.addEventListener('resize', () => this.calculateSldOffset());
  }

  updated(changedProperties: Map<string, any>) {
    super.updated(changedProperties);

    if (
      changedProperties.has('doc') ||
      changedProperties.has('gridSize') ||
      changedProperties.has('editCount')
    ) {
      this.functions = this.extractFunctions();
    }

    if (
      changedProperties.has('placing') ||
      changedProperties.has('doc') ||
      changedProperties.has('gridSize')
    ) {
      requestAnimationFrame(() => this.calculateSldOffset());
    }
  }

  private svgCoordinates(clientX: number, clientY: number): [number, number] {
    if (!this.svg) return [0, 0];
    const pt = this.svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const { x, y } = pt.matrixTransform(this.svg.getScreenCTM()!.inverse());
    return [x, y];
  }

  positionCoordinates(e: MouseEvent) {
    const coordinatesDiv = this.coordinatesRef?.value;
    if (coordinatesDiv) {
      coordinatesDiv.style.top = `${e.clientY}px`;
      coordinatesDiv.style.left = `${e.clientX + 16}px`;
    }
  }

  // eslint-disable-next-line class-methods-use-this
  private getBayBoundaries(
    bay: Element | null | undefined
  ): BayBoundaries | null {
    if (!bay || bay.tagName !== 'Bay') return null;

    const xAttr = getSLDAttributes(bay, 'x');
    const yAttr = getSLDAttributes(bay, 'y');
    const wAttr = getSLDAttributes(bay, 'w');
    const hAttr = getSLDAttributes(bay, 'h');

    if (!xAttr || !yAttr || !wAttr || !hAttr) return null;

    return {
      x: parseFloat(xAttr),
      y: parseFloat(yAttr),
      w: parseFloat(wAttr),
      h: parseFloat(hAttr),
    };
  }

  private clampFunctionPosition(
    fn: FunctionData,
    x: number,
    y: number
  ): [number, number] {
    const boundaries = this.getBayBoundaries(fn.parent);
    if (!boundaries) return [x, y];

    const clampedX = Math.max(
      boundaries.x,
      Math.min(x, boundaries.x + boundaries.w)
    );
    const clampedY = Math.max(
      boundaries.y,
      Math.min(y, boundaries.y + boundaries.h)
    );

    return [clampedX, clampedY];
  }

  private canPlaceFunction(fn: FunctionData, x: number, y: number): boolean {
    const boundaries = this.getBayBoundaries(fn.parent);
    if (!boundaries) return false;

    return (
      x >= boundaries.x &&
      y >= boundaries.y &&
      x <= boundaries.x + boundaries.w &&
      y <= boundaries.y + boundaries.h
    );
  }

  private extractFunctions(): FunctionData[] {
    if (!this.doc) return [];

    const functions = Array.from(this.doc.querySelectorAll('Function'));
    const result: FunctionData[] = [];

    functions.forEach(fn => {
      const xAttr = getSLDAttributes(fn, 'x');
      const yAttr = getSLDAttributes(fn, 'y');

      if (!xAttr || !yAttr) return;

      const x = parseFloat(xAttr);
      const y = parseFloat(yAttr);

      if (Number.isNaN(x) || Number.isNaN(y)) return;

      result.push({
        element: fn,
        name: fn.getAttribute('name') || 'Unknown',
        x,
        y,
        parent: fn.parentElement || null,
      });
    });

    return result;
  }

  private getSvgDimensions(): { width: number; height: number } {
    const substation = this.doc?.querySelector(':root > Substation');
    const w = substation
      ? parseFloat(getSLDAttributes(substation, 'w') ?? '0')
      : 0;
    const h = substation
      ? parseFloat(getSLDAttributes(substation, 'h') ?? '0')
      : 0;
    return {
      width: Math.max(1, w),
      height: Math.max(1, h),
    };
  }

  private calculateFunctionBoxWidth(name: string): number {
    const { ICON_WIDTH, CHAR_WIDTH, PADDING, SPACING, MIN_WIDTH } =
      this.FUNCTION_BOX;
    const textWidth = name.length * CHAR_WIDTH;
    return Math.max(MIN_WIDTH, ICON_WIDTH + SPACING + textWidth + PADDING);
  }

  private finalizeFunctionPlacement(fn: FunctionData): void {
    const rawX = this.mouseX - this.placingOffset[0];
    const rawY = this.mouseY - this.placingOffset[1];
    const [newX, newY] = this.clampFunctionPosition(fn, rawX, rawY);

    const edit = updateSLDAttributes(fn.element, this.nsp, {
      x: newX.toString(),
      y: newY.toString(),
    });

    this.dispatchEvent(newEditEventV2(edit));
  }

  private handleMouseMove(e: MouseEvent) {
    if (this.disabled) return;
    const [x, y] = this.svgCoordinates(e.clientX, e.clientY);
    this.mouseX = Math.floor(x);
    this.mouseY = Math.floor(y);
    this.positionCoordinates(e);
  }

  private handleFunctionClick(fn: FunctionData, e: MouseEvent) {
    if (this.disabled) return;

    e.stopPropagation();

    if (this.placing === fn.element) {
      this.finalizeFunctionPlacement(fn);
      return;
    }

    const offset: Point = [this.mouseX - fn.x, this.mouseY - fn.y];
    this.onStartPlaceFunction?.(fn.element, offset);
  }

  private handleContainerClick(e: MouseEvent) {
    if (this.placing) {
      const placingFn = this.functions.find(fn => fn.element === this.placing);
      if (placingFn) {
        this.finalizeFunctionPlacement(placingFn);
      }
    }
  }

  private renderFunction(fn: FunctionData, preview = false) {
    if (this.placing === fn.element && !preview) {
      return nothing;
    }

    const isPlacing = this.placing === fn.element;
    let { x, y } = fn;

    if (isPlacing) {
      x = this.mouseX - this.placingOffset[0];
      y = this.mouseY - this.placingOffset[1];
    }

    const { HEIGHT, ICON_SIZE, FONT_SIZE, BORDER_RADIUS, STROKE_WIDTH } =
      this.FUNCTION_BOX;
    const { NORMAL_FILL, PREVIEW_FILL, PREVIEW_STROKE, STROKE } =
      this.FUNCTION_COLORS;

    const boxWidth = this.calculateFunctionBoxWidth(fn.name);
    const rectX = x - boxWidth / 2;
    const rectY = y - HEIGHT / 2;

    let classAttr = 'function';
    if (preview) classAttr += ' preview';
    if (isPlacing) classAttr += ' placing';

    return svg`<g class="${classAttr}"
         @click=${(e: MouseEvent) => this.handleFunctionClick(fn, e)}
         tabindex="0">
        <rect
          x="${rectX}"
          y="${rectY}"
          width="${boxWidth}"
          height="${HEIGHT}"
          fill="${preview ? PREVIEW_FILL : NORMAL_FILL}"
          stroke="${preview ? PREVIEW_STROKE : STROKE}"
          stroke-width="${STROKE_WIDTH}"
          rx="${BORDER_RADIUS}"
        />
        <text
          x="${rectX + 0.2}"
          y="${y}"
          font-size="${ICON_SIZE}px"
          font-family="Material Symbols Outlined"
          alignment-baseline="central"
          fill="currentColor"
        >function</text>
        <text
          x="${rectX + 1}"
          y="${y}"
          font-size="${FONT_SIZE}px"
          font-family="Roboto, sans-serif"
          alignment-baseline="central"
          fill="currentColor"
        >${fn.name}</text>
        <title>${fn.name}</title>
      </g>`;
  }

  render() {
    const placingFn = this.functions.find(fn => fn.element === this.placing);
    const { width, height } = this.getSvgDimensions();

    let bayX = 0;
    let bayY = 0;
    let bayW = width;
    let bayH = height;

    if (this.placing && placingFn) {
      const boundaries = this.getBayBoundaries(placingFn.parent);
      if (boundaries) {
        bayX = boundaries.x;
        bayY = boundaries.y;
        bayW = boundaries.w;
        bayH = boundaries.h;
      }
    }

    let coordinates = html``;
    let invalid = false;
    let hidden = true;

    if (this.placing && placingFn) {
      hidden = false;
      const rawX = this.mouseX - this.placingOffset[0];
      const rawY = this.mouseY - this.placingOffset[1];

      invalid = !this.canPlaceFunction(placingFn, rawX, rawY);

      const [clampedX, clampedY] = this.clampFunctionPosition(
        placingFn,
        rawX,
        rawY
      );

      coordinates = html`${clampedX},${clampedY}`;
    }

    const coordinateTooltip = html`<div
      ${ref(this.coordinatesRef)}
      class="${classMap({ coordinates: true, invalid, hidden })}"
    >
      (${coordinates})
    </div>`;

    const gridPattern = this.placing
      ? svg`
          <defs>
            <pattern id="functions-grid" patternUnits="userSpaceOnUse" width="1" height="1">
              <rect width="1" height="1" fill="none" stroke="#888" stroke-opacity="0.3" stroke-width="0.06" />
            </pattern>
          </defs>
          <rect x="${bayX}" y="${bayY}" width="${bayW}" height="${bayH}" fill="url(#functions-grid)" />
        `
      : nothing;

    const placingTarget = this.placing
      ? svg`<rect x="${bayX}" y="${bayY}" width="${bayW}" height="${bayH}" fill="transparent"
               @click=${this.handleContainerClick} />`
      : nothing;

    return html`
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 ${width} ${height}"
        width="${width * this.gridSize}"
        height="${height * this.gridSize}"
        stroke-width="0.06"
        fill="none"
        style="position: absolute; top: ${this.sldOffsetTop}px; left: ${this
          .sldOffsetLeft}px;"
        @mousemove=${(e: MouseEvent) => this.handleMouseMove(e)}
        class="${classMap({
          placing: !!this.placing,
          disabled: this.disabled,
        })}"
      >
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');
          .function {
            cursor: pointer;
            pointer-events: ${this.disabled ? 'none' : 'all'};
          }
          .function.placing {
            cursor: move;
          }
          .function.preview {
            opacity: 0.7;
          }
          svg:not(:hover) .preview {
            visibility: hidden;
          }
          .function:focus {
            outline: none;
          }
          .function rect {
            user-select: none;
          }
          .function text {
            user-select: none;
            pointer-events: none;
          }
        </style>
        <rect width="100%" height="100%" fill="white" fill-opacity="0" />
        ${gridPattern} ${placingTarget}
        ${this.functions.map(fn => this.renderFunction(fn))}
        ${placingFn ? this.renderFunction(placingFn, true) : nothing}
      </svg>
      ${coordinateTooltip}
    `;
  }

  static styles = css`
    :host {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
    }

    svg {
      pointer-events: none;
    }

    svg.placing {
      pointer-events: auto;
    }

    svg.disabled {
      opacity: 0.5;
    }

    .coordinates {
      position: fixed;
      pointer-events: none;
      font-size: 16px;
      font-family: 'Roboto', sans-serif;
      padding: 8px;
      border-radius: 16px;
      background: #fffd;
      color: rgb(0, 0, 0, 0.83);
      z-index: 1000;
    }

    .coordinates.invalid {
      color: #bb1326;
    }

    .coordinates.hidden {
      display: none;
    }
  `;
}
