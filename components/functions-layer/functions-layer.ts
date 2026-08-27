/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { LitElement, html, css, svg, nothing } from 'lit';
import { property, state, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { createRef, Ref, ref } from 'lit/directives/ref.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';
import { newEditEventV2 } from '@openscd/oscd-api/utils.js';
import { OscdMenu } from '@omicronenergy/oscd-ui/menu/OscdMenu.js';
import { OscdMenuItem } from '@omicronenergy/oscd-ui/menu/OscdMenuItem.js';
import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
import { OscdFilledButton } from '@omicronenergy/oscd-ui/button/OscdFilledButton.js';
import {
  getSLDAttributes,
  updateSLDAttributes,
  getSldSvgs,
} from '../../util.js';
import {
  buildFunctionLinks,
  buildSourceRefKey,
  buildFunctionLinkPath,
  type FunctionLink,
  FunctionBoxGeometry,
} from './function-links.js';
import {
  FunctionContentPanel,
  type LNodeSelectionContext,
} from './function-content-panel.js';
import { buildRemoveSourceRefEdits } from '../function-link-dialog/link-edits.js';
import { FunctionLinkOverview } from './function-link-overview.js';
import {
  LINK_SERVICE_COLORS,
  SELECTED_PSR_HIGHLIGHT_STYLE,
  SOURCE_CANDIDATE_HIGHLIGHT_STYLE,
} from '../../const.js';

type Point = [number, number];

type FunctionData = {
  element: Element;
  name: string;
  x: number;
  y: number;
  parent?: Element | null;
};

export class FunctionsLayer extends ScopedElementsMixin(LitElement) {
  static get scopedElements() {
    return {
      'function-content-panel': FunctionContentPanel,
      'function-link-overview': FunctionLinkOverview,
      'oscd-menu': OscdMenu,
      'oscd-menu-item': OscdMenuItem,
      'oscd-icon': OscdIcon,
      'oscd-filled-button': OscdFilledButton,
    };
  }

  @state()
  selectedFunctionElement?: Element;

  @state()
  private contextMenu?: { element: Element; x: number; y: number };

  private readonly FUNCTION_BOX = {
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
  } as const;

  private readonly FUNCTION_COLORS = {
    NORMAL_FILL: 'white',
    PREVIEW_FILL: 'rgba(33, 150, 243, 0.1)',
    PREVIEW_STROKE: '#2196f3',
    STROKE: 'currentColor',
  } as const;

  @property({ attribute: false })
  doc?: XMLDocument;

  @property({ attribute: false })
  substation?: Element;

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

  @property({ attribute: false })
  onDonePlaceFunction?: () => void;

  @property({ attribute: false })
  onHoverFunction?: (funcElement: Element | null) => void;

  @property({ attribute: false })
  onSelectFunction?: (element: Element | null) => void;

  @property({ attribute: false })
  onCreateFunctionLink?: (context: LNodeSelectionContext) => void;

  @property({ attribute: false })
  onCancelCreateFunctionLink?: () => void;

  @property({ attribute: false })
  onSelectSourceFunction?: (sourceFunction: Element) => void;

  @property({ attribute: false })
  linkSourceCandidates: Element[] = [];

  @property({ type: Boolean })
  selectingLinkSource = false;

  @property({ type: Boolean })
  showLinks = true;

  @state()
  functions: FunctionData[] = [];

  @state()
  mouseX = 0;

  @state()
  mouseY = 0;

  @state()
  sldOffsetTop = 0;

  @state()
  sldOffsetLeft = 0;

  @state()
  private hoveredFunction: Element | null = null;

  @state()
  private selectedLink: string | null = null;

  @state()
  private expandedOverviewDetails = true;

  @state()
  private pendingDeleteSelectedLink = false;

  @state()
  private pendingRemovedSourceRefKeys: string[] = [];

  @query('svg')
  svg!: SVGSVGElement;

  @query('#functions-context-menu-anchor')
  private readonly menuAnchor!: HTMLSpanElement;

  coordinatesRef: Ref<HTMLElement> = createRef();

  private contextMenuRef: Ref<any> = createRef();

  private readonly handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && this.selectedFunctionElement) {
      this.selectedFunctionElement = undefined;
      this.onCancelCreateFunctionLink?.();
    }
  };

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('keydown', this.handleKeyDown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  firstUpdated() {
    this.calculateSldOffset();
    window.addEventListener('resize', () => this.calculateSldOffset());
  }

  updated(changedProperties: Map<string, any>) {
    super.updated(changedProperties);

    if (changedProperties.has('selectedFunctionElement')) {
      this.onSelectFunction?.(this.selectedFunctionElement ?? null);
    }

    if (
      changedProperties.has('doc') ||
      changedProperties.has('substation') ||
      changedProperties.has('gridSize') ||
      changedProperties.has('editCount')
    ) {
      this.functions = this.extractFunctions();
    }

    if (
      changedProperties.has('doc') ||
      changedProperties.has('substation') ||
      changedProperties.has('gridSize')
    ) {
      requestAnimationFrame(() => this.calculateSldOffset());
    }

    if (changedProperties.has('showLinks') && !this.showLinks) {
      this.closeLinkOverview();
    }
  }

  private calculateSldOffset() {
    const parent = this.parentElement;
    if (!parent) return;

    const sldEditor = parent.querySelector('sld-editor');
    const svgs = sldEditor ? getSldSvgs(sldEditor) : [];
    const substations = Array.from(
      (this.substation?.ownerDocument ?? this.doc)?.querySelectorAll(
        ':root > Substation'
      ) ?? []
    );
    const idx = this.substation ? substations.indexOf(this.substation) : 0;
    const sldSvg = svgs[idx] ?? null;

    if (!sldSvg) {
      console.warn(
        '[FunctionsLayer] Could not find SVG for substation. SLD offset calculation skipped.'
      );
      return;
    }

    const sldRect = sldSvg.getBoundingClientRect();
    const hostRect = this.getBoundingClientRect();
    this.sldOffsetTop = sldRect.top - hostRect.top;
    this.sldOffsetLeft = sldRect.left - hostRect.left;
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

  private extractFunctions(): FunctionData[] {
    if (!this.doc) return [];

    const scope: Element | Document = this.substation ?? this.doc;
    const functions = Array.from(
      scope.querySelectorAll('Function, EqFunction')
    );
    const result: FunctionData[] = [];

    functions.forEach(fn => {
      const xAttr = getSLDAttributes(fn, 'x');
      const yAttr = getSLDAttributes(fn, 'y');

      if (!xAttr || !yAttr) return;

      const x = Number.parseFloat(xAttr);
      const y = Number.parseFloat(yAttr);

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
    const substation =
      this.substation ?? this.doc?.querySelector(':root > Substation');
    const w = substation
      ? Number.parseFloat(getSLDAttributes(substation, 'w') ?? '0')
      : 0;
    const h = substation
      ? Number.parseFloat(getSLDAttributes(substation, 'h') ?? '0')
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
    const x = this.mouseX - this.placingOffset[0];
    const y = this.mouseY - this.placingOffset[1];

    const edit = updateSLDAttributes(fn.element, this.nsp, {
      x: x.toString(),
      y: y.toString(),
    });
    this.dispatchEvent(newEditEventV2(edit));
    this.onDonePlaceFunction?.();
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

    if (this.selectingLinkSource) {
      if (this.linkSourceCandidates.includes(fn.element)) {
        this.onSelectSourceFunction?.(fn.element);
      }
      return;
    }

    if (this.placing === fn.element) {
      this.finalizeFunctionPlacement(fn);
      return;
    }

    // Ctrl/Cmd + click to start placing, regular click to select
    if (e.ctrlKey || e.metaKey) {
      this.startPlacingFunction(fn);
    } else {
      this.selectedFunctionElement = fn.element;
    }
  }

  private handleFunctionContextMenu(fn: FunctionData, e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.contextMenu = { element: fn.element, x: e.clientX, y: e.clientY };
    requestAnimationFrame(() => {
      this.menuAnchor.style.left = `${e.clientX}px`;
      this.menuAnchor.style.top = `${e.clientY}px`;
      this.contextMenuRef.value?.show();
    });
  }

  private closeContextMenu() {
    this.contextMenu = undefined;
  }

  private startPlacingFunction(fn: FunctionData) {
    const offset: Point = [this.mouseX - fn.x, this.mouseY - fn.y];
    this.onStartPlaceFunction?.(fn.element, offset);
  }

  private handleMoveFunction() {
    const el = this.contextMenu?.element;
    if (!el) return;
    const fn = this.functions.find(f => f.element === el);
    if (!fn) return;
    this.startPlacingFunction(fn);
    this.closeContextMenu();
  }

  private handleContainerClick(e: MouseEvent) {
    if (this.placing) {
      const placingFn = this.functions.find(fn => fn.element === this.placing);
      if (placingFn) {
        this.finalizeFunctionPlacement(placingFn);
      }
    }
  }

  private handleFunctionMouseEnter(fn: FunctionData) {
    if (!this.placing) {
      this.hoveredFunction = fn.element;
      this.onHoverFunction?.(fn.element);
    }
  }

  private handleFunctionMouseLeave() {
    this.hoveredFunction = null;
    this.onHoverFunction?.(null);
  }

  private getFunctionLinks(): FunctionLink[] {
    const scope: Element | Document | null =
      this.substation ?? this.doc ?? null;
    return buildFunctionLinks(scope, this.doc);
  }

  private getSelectedLink(
    functionLinks: FunctionLink[]
  ): FunctionLink | undefined {
    return functionLinks.find(link => link.id === this.selectedLink);
  }

  private getLinkOverviewTop(selectedLink: FunctionLink): number | undefined {
    const sourceFn = this.functions.find(
      fn => fn.element === selectedLink.sourceFunction
    );
    const sinkFn = this.functions.find(
      fn => fn.element === selectedLink.sinkFunction
    );
    if (!sourceFn || !sinkFn) return undefined;

    const lowestBottom = Math.max(
      this.getFunctionBoxGeometry(sourceFn).bottom,
      this.getFunctionBoxGeometry(sinkFn).bottom
    );
    return this.sldOffsetTop + lowestBottom * this.gridSize + 12;
  }

  private getFunctionBoxGeometry(fn: FunctionData): FunctionBoxGeometry {
    const width = this.calculateFunctionBoxWidth(fn.name);
    return {
      x: fn.x,
      y: fn.y,
      width,
      height: this.FUNCTION_BOX.HEIGHT,
      left: fn.x - width / 2,
      right: fn.x + width / 2,
      top: fn.y - this.FUNCTION_BOX.HEIGHT / 2,
      bottom: fn.y + this.FUNCTION_BOX.HEIGHT / 2,
    };
  }

  private handleLinkClick(linkId: string) {
    if (this.selectedLink !== linkId) {
      this.clearPendingLinkOverviewChanges();
    }

    this.selectedLink = linkId;
  }

  private closeLinkOverview() {
    this.clearPendingLinkOverviewChanges();
    this.selectedLink = null;
  }

  private clearPendingLinkOverviewChanges() {
    this.pendingDeleteSelectedLink = false;
    this.pendingRemovedSourceRefKeys = [];
  }

  private toggleOverviewLinkDetails() {
    this.expandedOverviewDetails = !this.expandedOverviewDetails;
  }

  private hasPendingSourceRefDeletion(sourceRef: Element): boolean {
    const sourceRefKey = buildSourceRefKey(sourceRef);
    return this.pendingRemovedSourceRefKeys.includes(sourceRefKey);
  }

  private getVisibleSourceRefs(sourceRefs: Element[]): Element[] {
    return sourceRefs.filter(
      sourceRef => !this.hasPendingSourceRefDeletion(sourceRef)
    );
  }

  private deleteOverviewLink() {
    this.pendingDeleteSelectedLink = true;
  }

  private deleteOverviewSourceRef(sourceRefs: Element[], sourceRef: Element) {
    const sourceRefKey = buildSourceRefKey(sourceRef);
    if (this.pendingRemovedSourceRefKeys.includes(sourceRefKey)) return;

    this.pendingRemovedSourceRefKeys = [
      ...this.pendingRemovedSourceRefKeys,
      sourceRefKey,
    ];

    const remainingSourceRefs = sourceRefs.filter(
      sourceReference =>
        buildSourceRefKey(sourceReference) !== sourceRefKey &&
        !this.hasPendingSourceRefDeletion(sourceReference)
    );

    if (!remainingSourceRefs.length) {
      this.deleteOverviewLink();
    }
  }

  private handleOverviewSourceRefDelete(sourceRef: Element) {
    if (!this.selectedLink) return;
    const selectedLink = this.getFunctionLinks().find(
      link => link.id === this.selectedLink
    );
    if (selectedLink?.sourceRefs.includes(sourceRef)) {
      this.deleteOverviewSourceRef(selectedLink.sourceRefs, sourceRef);
    }
  }

  private saveLinkOverviewChanges(links: FunctionLink[]) {
    if (!this.selectedLink) {
      this.closeLinkOverview();
      return;
    }

    const selectedLink = this.getSelectedLink(links);
    if (!selectedLink) {
      this.closeLinkOverview();
      return;
    }

    const removedSourceRefsByKey = new Map<string, Element>();

    selectedLink.sourceRefs.forEach(sourceRef => {
      const sourceRefKey = buildSourceRefKey(sourceRef);
      if (
        this.pendingDeleteSelectedLink ||
        this.pendingRemovedSourceRefKeys.includes(sourceRefKey)
      ) {
        removedSourceRefsByKey.set(sourceRefKey, sourceRef);
      }
    });

    const edits = buildRemoveSourceRefEdits(
      Array.from(removedSourceRefsByKey.values())
    );

    if (edits.length) {
      this.dispatchEvent(
        newEditEventV2(edits, {
          title: 'Update Function Links',
        })
      );
    }

    this.closeLinkOverview();
  }

  private renderFunctionLink(link: FunctionLink) {
    const sourceFn = this.functions.find(
      fn => fn.element === link.sourceFunction
    );
    const sinkFn = this.functions.find(fn => fn.element === link.sinkFunction);

    if (!sourceFn || !sinkFn) return nothing;

    const sourceBox = this.getFunctionBoxGeometry(sourceFn);
    const sinkBox = this.getFunctionBoxGeometry(sinkFn);
    const laneOffset =
      (link.parallelIndex - (link.parallelCount - 1) / 2) * 0.35;
    const path = buildFunctionLinkPath(sourceBox, sinkBox, laneOffset);
    const color = LINK_SERVICE_COLORS[link.service];
    const selected = this.selectedLink === link.id;

    return svg`
      <g class="function-link ${selected ? 'selected' : ''}">
        <path
          class="function-link-visible"
          d="${path}"
          stroke="${color}"
          marker-end="url(#function-link-arrow-${link.service})"
        ></path>
        <path
          class="function-link-hitbox"
          data-testid="function-link-hitbox"
          data-link-id="${link.id}"
          d="${path}"
          @click=${(e: MouseEvent) => {
            e.stopPropagation();
            this.handleLinkClick(link.id);
          }}
        ></path>
      </g>
    `;
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
    const isSourceCandidate = this.linkSourceCandidates.includes(fn.element);
    if (this.selectingLinkSource && isSourceCandidate)
      classAttr += ' source-candidate';
    if (this.selectingLinkSource && !isSourceCandidate)
      classAttr += ' source-blocked';
    const isHovered = this.hoveredFunction === fn.element;
    const isSelected = this.selectedFunctionElement === fn.element;
    if (isSelected) classAttr += ' selected';

    let fill: string;
    let stroke: string;
    let strokeWidth: number;
    if (isSelected || isHovered) {
      fill = SELECTED_PSR_HIGHLIGHT_STYLE.fill;
      stroke = SELECTED_PSR_HIGHLIGHT_STYLE.stroke;
      strokeWidth = SELECTED_PSR_HIGHLIGHT_STYLE.strokeWidth;
    } else if (this.selectingLinkSource && isSourceCandidate) {
      fill = SOURCE_CANDIDATE_HIGHLIGHT_STYLE.fill;
      stroke = SOURCE_CANDIDATE_HIGHLIGHT_STYLE.stroke;
      strokeWidth = STROKE_WIDTH * 1.5;
    } else if (preview) {
      fill = PREVIEW_FILL;
      stroke = PREVIEW_STROKE;
      strokeWidth = STROKE_WIDTH;
    } else {
      fill = NORMAL_FILL;
      stroke = STROKE;
      strokeWidth = STROKE_WIDTH;
    }

    const centerY = rectY + HEIGHT / 2;
    return svg`<g class="${classAttr}"
         @click=${(e: MouseEvent) => this.handleFunctionClick(fn, e)}
         @mouseenter=${() => this.handleFunctionMouseEnter(fn)}
         @mouseleave=${() => this.handleFunctionMouseLeave()}
         @contextmenu=${(e: MouseEvent) =>
           this.handleFunctionContextMenu(fn, e)}
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
    const functionLinks = this.showLinks ? this.getFunctionLinks() : [];
    const selectedLink = this.getSelectedLink(functionLinks);
    const placingFn = this.functions.find(fn => fn.element === this.placing);
    const { width, height } = this.getSvgDimensions();

    let coordinates = html``;
    let hideCoordinateTooltip = true;

    if (this.placing && placingFn) {
      hideCoordinateTooltip = false;
      const x = this.mouseX - this.placingOffset[0];
      const y = this.mouseY - this.placingOffset[1];
      coordinates = html`${x},${y}`;
    }

    const coordinateTooltip = html`<div
      ${ref(this.coordinatesRef)}
      class="${classMap({ coordinates: true, hidden: hideCoordinateTooltip })}"
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
          <rect x="0" y="0" width="${width}" height="${height}" fill="url(#functions-grid)" />
        `
      : nothing;

    const placingTarget = this.placing
      ? svg`<rect x="0" y="0" width="${width}" height="${height}" fill="transparent"
               @click=${this.handleContainerClick} />`
      : nothing;

    const contextMenuTemplate = html`
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
          <oscd-menu-item @click=${() => this.handleMoveFunction()}
            ><span class="function-menu-item"
              ><oscd-icon>open_with</oscd-icon> Move function</span
            ></oscd-menu-item
          >
        </oscd-menu>
      </div>
    `;

    return html`
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
              .function.source-blocked {
                opacity: 0.45;
                cursor: not-allowed;
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
              .function-link {
                pointer-events: none;
              }
              .function-link-visible {
                fill: none;
                stroke-width: 0.08;
                stroke-linecap: round;
                stroke-linejoin: round;
                opacity: 0.9;
              }
              .function-link-hitbox {
                fill: none;
                stroke: transparent;
                stroke-width: 0.35;
                pointer-events: all;
                cursor: pointer;
              }
              .function-link.selected .function-link-visible {
                opacity: 1;
                stroke-width: 0.12;
              }
            </style>
            <defs>
              ${Object.entries(LINK_SERVICE_COLORS).map(
                ([service, color]) => svg`
                  <marker
                    id="function-link-arrow-${service}"
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="${color}"></path>
                  </marker>
                `
              )}
            </defs>
            <rect width="100%" height="100%" fill="white" fill-opacity="0" />
            ${gridPattern} ${placingTarget}
            ${functionLinks.map(link => this.renderFunctionLink(link))}
            ${this.functions.map(fn => this.renderFunction(fn))}
            ${placingFn ? this.renderFunction(placingFn, true) : nothing}
          </svg>
          ${coordinateTooltip}
        </div>
        ${contextMenuTemplate}
        <function-link-overview
          .selectedLink=${selectedLink}
          .overviewTop=${selectedLink
            ? this.getLinkOverviewTop(selectedLink)
            : undefined}
          .expandedDetails=${this.expandedOverviewDetails}
          .pendingDelete=${this.pendingDeleteSelectedLink}
          .pendingRemovedSourceRefKeys=${this.pendingRemovedSourceRefKeys}
          @close=${() => this.closeLinkOverview()}
          @toggle-details=${() => this.toggleOverviewLinkDetails()}
          @delete-link=${() => this.deleteOverviewLink()}
          @delete-source-ref=${(e: CustomEvent<Element>) =>
            this.handleOverviewSourceRefDelete(e.detail)}
          @save=${() => this.saveLinkOverviewChanges(functionLinks)}
        ></function-link-overview>
        ${this.selectedFunctionElement
          ? html`<div class="sidebar">
              <function-content-panel
                .functionElement=${this.selectedFunctionElement}
                .selectingLinkSource=${this.selectingLinkSource}
                @start-create-function-link=${(
                  e: CustomEvent<LNodeSelectionContext>
                ) => this.onCreateFunctionLink?.(e.detail)}
                @cancel-create-function-link=${() =>
                  this.onCancelCreateFunctionLink?.()}
                @close=${() => {
                  this.selectedFunctionElement = undefined;
                }}
              ></function-content-panel>
            </div>`
          : nothing}
      </div>
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
}
