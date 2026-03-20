import { __decorate } from "tslib";
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { LitElement, html, css, svg, nothing } from 'lit';
import { property, state, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';
import { newEditEventV2 } from '@openscd/oscd-api/utils.js';
import { OscdMenu } from '@omicronenergy/oscd-ui/menu/OscdMenu.js';
import { OscdMenuItem } from '@omicronenergy/oscd-ui/menu/OscdMenuItem.js';
import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
import { getSLDAttributes, updateSLDAttributes, getSldSvgs, } from '../../util.js';
import { FunctionContentPanel } from './function-content-panel.js';
import { SELECTED_PSR_HIGHLIGHT_STYLE } from '../../const.js';
export class FunctionsLayer extends ScopedElementsMixin(LitElement) {
    constructor() {
        super(...arguments);
        this.FUNCTION_BOX = {
            HEIGHT: 1,
            ICON_SIZE: 0.8,
            ICON_WIDTH: 0.8,
            FONT_SIZE: 0.5,
            CHAR_WIDTH: 0.24,
            PADDING: 0.4,
            SPACING: 0.2,
            MIN_WIDTH: 2,
            BORDER_RADIUS: 0.15,
            STROKE_WIDTH: 0.04,
        };
        this.FUNCTION_COLORS = {
            NORMAL_FILL: 'white',
            PREVIEW_FILL: 'rgba(33, 150, 243, 0.1)',
            PREVIEW_STROKE: '#2196f3',
            STROKE: 'currentColor',
        };
        this.editCount = -1;
        this.gridSize = 24;
        this.disabled = false;
        this.nsp = 'eosld';
        this.placingOffset = [0, 0];
        this.functions = [];
        this.mouseX = 0;
        this.mouseY = 0;
        this.sldOffsetTop = 0;
        this.sldOffsetLeft = 0;
        this.hoveredFunction = null;
        this.coordinatesRef = createRef();
        this.contextMenuRef = createRef();
    }
    static get scopedElements() {
        return {
            'function-content-panel': FunctionContentPanel,
            'oscd-menu': OscdMenu,
            'oscd-menu-item': OscdMenuItem,
            'oscd-icon': OscdIcon,
        };
    }
    firstUpdated() {
        this.calculateSldOffset();
        window.addEventListener('resize', () => this.calculateSldOffset());
    }
    updated(changedProperties) {
        super.updated(changedProperties);
        if (changedProperties.has('doc') ||
            changedProperties.has('substation') ||
            changedProperties.has('gridSize') ||
            changedProperties.has('editCount')) {
            this.functions = this.extractFunctions();
        }
        if (changedProperties.has('doc') ||
            changedProperties.has('substation') ||
            changedProperties.has('gridSize')) {
            requestAnimationFrame(() => this.calculateSldOffset());
        }
    }
    calculateSldOffset() {
        const parent = this.parentElement;
        if (!parent)
            return;
        const sldEditor = parent.querySelector('sld-editor');
        const svgs = sldEditor ? getSldSvgs(sldEditor) : [];
        const substations = Array.from((this.substation?.ownerDocument ?? this.doc)?.querySelectorAll(':root > Substation') ?? []);
        const idx = this.substation ? substations.indexOf(this.substation) : 0;
        const sldSvg = svgs[idx] ?? null;
        if (!sldSvg) {
            console.warn('[FunctionsLayer] Could not find SVG for substation. SLD offset calculation skipped.');
            return;
        }
        const sldRect = sldSvg.getBoundingClientRect();
        const hostRect = this.getBoundingClientRect();
        this.sldOffsetTop = sldRect.top - hostRect.top;
        this.sldOffsetLeft = sldRect.left - hostRect.left;
    }
    svgCoordinates(clientX, clientY) {
        if (!this.svg)
            return [0, 0];
        const pt = this.svg.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        const { x, y } = pt.matrixTransform(this.svg.getScreenCTM().inverse());
        return [x, y];
    }
    positionCoordinates(e) {
        const coordinatesDiv = this.coordinatesRef?.value;
        if (coordinatesDiv) {
            coordinatesDiv.style.top = `${e.clientY}px`;
            coordinatesDiv.style.left = `${e.clientX + 16}px`;
        }
    }
    extractFunctions() {
        if (!this.doc)
            return [];
        const scope = this.substation ?? this.doc;
        const functions = Array.from(scope.querySelectorAll('Function'));
        const result = [];
        functions.forEach(fn => {
            const xAttr = getSLDAttributes(fn, 'x');
            const yAttr = getSLDAttributes(fn, 'y');
            if (!xAttr || !yAttr)
                return;
            const x = parseFloat(xAttr);
            const y = parseFloat(yAttr);
            if (Number.isNaN(x) || Number.isNaN(y))
                return;
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
    getSvgDimensions() {
        const substation = this.substation ?? this.doc?.querySelector(':root > Substation');
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
    calculateFunctionBoxWidth(name) {
        const { ICON_WIDTH, CHAR_WIDTH, PADDING, SPACING, MIN_WIDTH } = this.FUNCTION_BOX;
        const textWidth = name.length * CHAR_WIDTH;
        return Math.max(MIN_WIDTH, ICON_WIDTH + SPACING + textWidth + PADDING);
    }
    finalizeFunctionPlacement(fn) {
        const x = this.mouseX - this.placingOffset[0];
        const y = this.mouseY - this.placingOffset[1];
        const edit = updateSLDAttributes(fn.element, this.nsp, {
            x: x.toString(),
            y: y.toString(),
        });
        this.dispatchEvent(newEditEventV2(edit));
    }
    handleMouseMove(e) {
        if (this.disabled)
            return;
        const [x, y] = this.svgCoordinates(e.clientX, e.clientY);
        this.mouseX = Math.floor(x);
        this.mouseY = Math.floor(y);
        this.positionCoordinates(e);
    }
    handleFunctionClick(fn, e) {
        if (this.disabled)
            return;
        e.stopPropagation();
        if (this.placing === fn.element) {
            this.finalizeFunctionPlacement(fn);
            return;
        }
        const offset = [this.mouseX - fn.x, this.mouseY - fn.y];
        this.onStartPlaceFunction?.(fn.element, offset);
    }
    handleFunctionContextMenu(fn, e) {
        e.preventDefault();
        e.stopPropagation();
        this.contextMenu = { element: fn.element, x: e.clientX, y: e.clientY };
        requestAnimationFrame(() => {
            this.menuAnchor.style.left = `${e.clientX}px`;
            this.menuAnchor.style.top = `${e.clientY}px`;
            this.contextMenuRef.value?.show();
        });
    }
    closeContextMenu() {
        this.contextMenu = undefined;
    }
    handleContainerClick(e) {
        if (this.placing) {
            const placingFn = this.functions.find(fn => fn.element === this.placing);
            if (placingFn) {
                this.finalizeFunctionPlacement(placingFn);
            }
        }
    }
    handleFunctionMouseEnter(fn) {
        if (!this.placing) {
            this.hoveredFunction = fn.element;
            this.onHoverFunction?.(fn.element);
        }
    }
    handleFunctionMouseLeave() {
        this.hoveredFunction = null;
        this.onHoverFunction?.(null);
    }
    renderFunction(fn, preview = false) {
        if (this.placing === fn.element && !preview) {
            return nothing;
        }
        const isPlacing = this.placing === fn.element;
        let { x, y } = fn;
        if (isPlacing) {
            x = this.mouseX - this.placingOffset[0];
            y = this.mouseY - this.placingOffset[1];
        }
        const { HEIGHT, ICON_SIZE, FONT_SIZE, BORDER_RADIUS, STROKE_WIDTH } = this.FUNCTION_BOX;
        const { NORMAL_FILL, PREVIEW_FILL, PREVIEW_STROKE, STROKE } = this.FUNCTION_COLORS;
        const boxWidth = this.calculateFunctionBoxWidth(fn.name);
        const rectX = x - boxWidth / 2;
        const rectY = y - HEIGHT / 2;
        let classAttr = 'function';
        if (preview)
            classAttr += ' preview';
        if (isPlacing)
            classAttr += ' placing';
        const isHovered = this.hoveredFunction === fn.element;
        let fill;
        let stroke;
        let strokeWidth;
        if (isHovered) {
            fill = SELECTED_PSR_HIGHLIGHT_STYLE.fill;
            stroke = SELECTED_PSR_HIGHLIGHT_STYLE.stroke;
            strokeWidth = SELECTED_PSR_HIGHLIGHT_STYLE.strokeWidth;
        }
        else if (preview) {
            fill = PREVIEW_FILL;
            stroke = PREVIEW_STROKE;
            strokeWidth = STROKE_WIDTH;
        }
        else {
            fill = NORMAL_FILL;
            stroke = STROKE;
            strokeWidth = STROKE_WIDTH;
        }
        const centerY = rectY + HEIGHT / 2;
        return svg `<g class="${classAttr}"
         @click=${(e) => this.handleFunctionClick(fn, e)}
         @mouseenter=${() => this.handleFunctionMouseEnter(fn)}
         @mouseleave=${() => this.handleFunctionMouseLeave()}
         @contextmenu=${(e) => this.handleFunctionContextMenu(fn, e)}
         tabindex="0">
        <rect
          x="${rectX}"
          y="${rectY}"
          width="${boxWidth}"
          height="${HEIGHT}"
          fill="${fill}"
          stroke="${stroke}"
          stroke-width="${strokeWidth}"
          rx="${BORDER_RADIUS}"
          id="${fn.name}"
        />
        <text
          x="${rectX + 0.2}"
          y="${centerY}"
          font-size="${ICON_SIZE}px"
          font-family="Material Symbols Outlined"
          dominant-baseline="central"
          alignment-baseline="central"
          fill="currentColor"
        >function</text>
        <text
          x="${rectX + 1}"
          y="${centerY}"
          font-size="${FONT_SIZE}px"
          font-family="Roboto, sans-serif"
          dominant-baseline="central"
          alignment-baseline="central"
          fill="currentColor"
        >${fn.name}</text>
        <title>${fn.name}</title>
      </g>`;
    }
    render() {
        const placingFn = this.functions.find(fn => fn.element === this.placing);
        const { width, height } = this.getSvgDimensions();
        let coordinates = html ``;
        let hideCoordinateTooltip = true;
        if (this.placing && placingFn) {
            hideCoordinateTooltip = false;
            const x = this.mouseX - this.placingOffset[0];
            const y = this.mouseY - this.placingOffset[1];
            coordinates = html `${x},${y}`;
        }
        const coordinateTooltip = html `<div
      ${ref(this.coordinatesRef)}
      class="${classMap({ coordinates: true, hidden: hideCoordinateTooltip })}"
    >
      (${coordinates})
    </div>`;
        const gridPattern = this.placing
            ? svg `
          <defs>
            <pattern id="functions-grid" patternUnits="userSpaceOnUse" width="1" height="1">
              <rect width="1" height="1" fill="none" stroke="#888" stroke-opacity="0.3" stroke-width="0.06" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="${width}" height="${height}" fill="url(#functions-grid)" />
        `
            : nothing;
        const placingTarget = this.placing
            ? svg `<rect x="0" y="0" width="${width}" height="${height}" fill="transparent"
               @click=${this.handleContainerClick} />`
            : nothing;
        const contextMenuTemplate = html `
      <div style="position:relative;pointer-events:auto;">
        <span
          id="functions-context-menu-anchor"
          style="position:fixed;pointer-events:none;"
        ></span>
        <oscd-menu
          ${ref(this.contextMenuRef)}
          anchor="functions-context-menu-anchor"
          positioning="fixed"
          @closed=${() => this.closeContextMenu()}
        >
          <oscd-menu-item
            @click=${() => {
            this.selectedFunctionElement = this.contextMenu?.element;
            this.closeContextMenu();
        }}
            ><span class="function-menu-item"
              ><oscd-icon>function</oscd-icon> Function details</span
            ></oscd-menu-item
          >
        </oscd-menu>
      </div>
    `;
        return html `
      <div style="display: flex; height: 100%;">
        <div style="flex: 1; position: relative;">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 ${width} ${height}"
            width="${width * this.gridSize}"
            height="${height * this.gridSize}"
            stroke-width="0.06"
            fill="none"
            style="position: absolute; top: ${this.sldOffsetTop}px; left: ${this
            .sldOffsetLeft}px;"
            @mousemove=${(e) => this.handleMouseMove(e)}
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
        </div>
        ${contextMenuTemplate}
        ${this.selectedFunctionElement
            ? html `<div class="sidebar">
              <function-content-panel
                .functionElement=${this.selectedFunctionElement}
                @close=${() => {
                this.selectedFunctionElement = undefined;
            }}
              ></function-content-panel>
            </div>`
            : nothing}
      </div>
    `;
    }
}
FunctionsLayer.styles = css `
    :host {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 2;
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

    .coordinates.hidden {
      display: none;
    }

    .sidebar {
      pointer-events: auto;
      height: 100%;
      position: relative;
      z-index: 1;
    }

    oscd-menu {
      --md-menu-container-color: var(--oscd-base3);
    }

    oscd-menu-item {
      --md-menu-item-label-text-color: var(--oscd-base01);
    }

    .function-menu-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `;
__decorate([
    state()
], FunctionsLayer.prototype, "selectedFunctionElement", void 0);
__decorate([
    state()
], FunctionsLayer.prototype, "contextMenu", void 0);
__decorate([
    property({ attribute: false })
], FunctionsLayer.prototype, "doc", void 0);
__decorate([
    property({ attribute: false })
], FunctionsLayer.prototype, "substation", void 0);
__decorate([
    property({ type: Number })
], FunctionsLayer.prototype, "editCount", void 0);
__decorate([
    property({ type: Number })
], FunctionsLayer.prototype, "gridSize", void 0);
__decorate([
    property({ type: Boolean })
], FunctionsLayer.prototype, "disabled", void 0);
__decorate([
    property({ type: String })
], FunctionsLayer.prototype, "nsp", void 0);
__decorate([
    property({ attribute: false })
], FunctionsLayer.prototype, "placing", void 0);
__decorate([
    property({ attribute: false })
], FunctionsLayer.prototype, "placingOffset", void 0);
__decorate([
    property({ attribute: false })
], FunctionsLayer.prototype, "onStartPlaceFunction", void 0);
__decorate([
    property({ attribute: false })
], FunctionsLayer.prototype, "onHoverFunction", void 0);
__decorate([
    state()
], FunctionsLayer.prototype, "functions", void 0);
__decorate([
    state()
], FunctionsLayer.prototype, "mouseX", void 0);
__decorate([
    state()
], FunctionsLayer.prototype, "mouseY", void 0);
__decorate([
    state()
], FunctionsLayer.prototype, "sldOffsetTop", void 0);
__decorate([
    state()
], FunctionsLayer.prototype, "sldOffsetLeft", void 0);
__decorate([
    state()
], FunctionsLayer.prototype, "hoveredFunction", void 0);
__decorate([
    query('svg')
], FunctionsLayer.prototype, "svg", void 0);
__decorate([
    query('#functions-context-menu-anchor')
], FunctionsLayer.prototype, "menuAnchor", void 0);
//# sourceMappingURL=functions-layer.js.map