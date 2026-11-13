/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { LitElement, html, css, nothing } from 'lit';
import { property, state, query } from 'lit/decorators.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';
import { getReference, identity, importLNodeType } from '@openscd/scl-lib';
import { newEditEventV2 } from '@openscd/oscd-api/utils.js';
import { createElement } from '@compas-oscd/xml';
import { OscdFilledIconButton } from '@omicronenergy/oscd-ui/iconbutton/OscdFilledIconButton.js';
import { OscdOutlinedIconButton } from '@omicronenergy/oscd-ui/iconbutton/OscdOutlinedIconButton.js';
import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';

import { SldEditor } from '@omicronenergy/oscd-editor-sld/sld-editor.js';
import {
  bayIcon,
  equipmentIcon,
  ptrIcon,
  voltageLevelIcon,
  functionsIcon,
  functionsOffIcon,
  functionAddIcon,
} from './icons.js';
import {
  eqTypes,
  isBusBar,
  makeBusBar,
  setSLDAttributes,
  sldNs,
  xmlnsNs,
  getFunctionCoordinates,
  getSldSvgs,
  highlightBusbars,
  clearBusbarHighlights,
  eTr6100Ns,
  createLNodeFromType,
  uniqueLNodeTypes,
  eTr6100PrivType,
  type FunctionData,
} from './util.js';
import { FunctionsLayer } from './components/functions-layer/functions-layer.js';
import {
  CreateFunctionDialog,
  type SaveFunctionDetail,
} from './components/create-function-dialog/create-function-dialog.js';
import { FunctionLinkDialog } from './components/function-link-dialog/function-link-dialog.js';
import {
  AddInputDialog,
  type SaveInputDetail,
} from './components/add-input-dialog/add-input-dialog.js';
import { buildInputEdits } from './components/add-input-dialog/input-edits.js';
import { buildFunctionLinkEdits } from './components/function-link-dialog/link-edits.js';
import {
  buildUpdateFunctionEdits,
  createSubFunctionElement,
  type UpdateFunctionData,
} from './components/functions-layer/function-edits.js';
import type { CreateFunctionLinkEventDetail } from './components/function-link-dialog/function-link-dialog.js';
import type { LNodeSelectionContext } from './components/functions-layer/function-content-panel.js';
import {
  PSR_TAGS,
  PSR_HIGHLIGHT_STYLE,
  SELECTED_PSR_HIGHLIGHT_STYLE,
  type HighlightStyle,
} from './const.js';

type FunctionTag = 'Function' | 'EqFunction';
type SubFunctionTag = 'SubFunction' | 'EqSubFunction';

/** An editor [[`plugin`]] for creating bay templates using single line diagrams */
export default class BayTemplatePlugin extends ScopedElementsMixin(LitElement) {
  static get scopedElements() {
    return {
      'oscd-icon-button': OscdOutlinedIconButton,
      'oscd-filled-icon-button': OscdFilledIconButton,
      'oscd-icon': OscdIcon,
      'functions-layer': FunctionsLayer,
      'sld-editor': SldEditor,
      'create-function-dialog': CreateFunctionDialog,
      'function-link-dialog': FunctionLinkDialog,
      'add-input-dialog': AddInputDialog,
    };
  }

  @property({ attribute: false })
  doc?: XMLDocument;

  @property({ type: Number })
  editCount = -1;

  @property({ type: Number })
  gridSize: number = 24;

  @property({ attribute: false })
  compasApi?: {
    lNodeLibrary: {
      loadLNodeLibrary: () => Promise<Document | null>;
      lNodeLibrary: () => Document | null;
    };
  };

  @query('sld-editor') sldEditor?: SldEditor;

  @query('.editor-container') editorContainer?: HTMLElement;

  @query('#labels') labelToggle?: OscdOutlinedIconButton;

  @query('create-function-dialog') createFunctionDialog?: CreateFunctionDialog;

  @query('function-link-dialog') functionLinkDialog!: FunctionLinkDialog;

  @query('add-input-dialog') addInputDialog!: AddInputDialog;

  @state()
  sldEditorInAction: boolean = false;

  @state()
  functionsInAction: boolean = false;

  @state()
  addingFunction: boolean = false;

  @state()
  showFunctions: boolean = false;

  @state()
  showFunctionLinks = true;

  @state()
  templateElements: Record<string, Element> = {};

  @state()
  nsp = 'eosld';

  @state()
  placingFunction?: Element;

  @state()
  placingFunctionOffset: [number, number] = [0, 0];

  @state()
  highlight: { id: string; style: HighlightStyle }[] = [];

  @state()
  functionHoverHighlight: { id: string; style: HighlightStyle }[] = [];

  @state()
  highlightBeforeAddingFunction: {
    id: string;
    style: HighlightStyle;
  }[] = [];

  @state()
  private hoveredSubstation?: Element;

  @state()
  selectedElement?: Element;

  @state()
  private sldBounds: {
    top: number;
    left: number;
    width: number;
    height: number;
  }[] = [];

  @state()
  private linkSourceCandidates: Element[] = [];

  @state()
  private selectingLinkSource = false;

  @state()
  private lnodeLibrary: Document | null = null;

  private lnodeLibraryLoading = false;

  @state()
  private pendingLinkContext: LNodeSelectionContext | null = null;

  private readonly onResize = () => this.calculateSldBounds();

  private readonly eqFunctionHostTags = new Set([
    'ConductingEquipment',
    'PowerTransformer',
    'TransformerWinding',
  ]);

  private resolveFunctionTags(tagName: string): {
    functionTag: FunctionTag;
    subFunctionTag: SubFunctionTag;
  } {
    const functionTag: FunctionTag = this.eqFunctionHostTags.has(tagName)
      ? 'EqFunction'
      : 'Function';

    return {
      functionTag,
      subFunctionTag:
        functionTag === 'EqFunction' ? 'EqSubFunction' : 'SubFunction',
    };
  }

  get showLabels(): boolean {
    if (this.labelToggle) return !this.labelToggle.selected;
    return true;
  }

  private loadLNodeLibrary() {
    const libraryApi = this.compasApi?.lNodeLibrary;
    if (!libraryApi) return;

    const cachedLibrary = libraryApi.lNodeLibrary?.() ?? null;
    if (cachedLibrary) {
      this.lnodeLibrary = cachedLibrary;
      return;
    }

    if (!libraryApi.loadLNodeLibrary || this.lnodeLibraryLoading) return;
    this.lnodeLibraryLoading = true;

    libraryApi
      .loadLNodeLibrary()
      .then(library => {
        if (library) this.lnodeLibrary = library;
      })
      .catch(error => {
        // eslint-disable-next-line no-console
        console.error('Failed to load LNode library:', error);
      })
      .finally(() => {
        this.lnodeLibraryLoading = false;
      });
  }

  connectedCallback() {
    super.connectedCallback();

    this.loadLNodeLibrary();

    window.addEventListener('keydown', this.handleKeydown);
    window.addEventListener('resize', this.onResize);
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    window.removeEventListener('keydown', this.handleKeydown);
    window.removeEventListener('resize', this.onResize);

    if (this.sldEditor) {
      clearBusbarHighlights(this.sldEditor);
    }
  }

  private handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && this.inAction) {
      event.preventDefault();
      if (this.addingFunction) {
        this.showFunctions = false;
      }
      this.reset();
    }
  };

  handleStartPlaceFunction = (element: Element, offset: [number, number]) => {
    this.placingFunction = element;
    this.placingFunctionOffset = offset;
    this.functionsInAction = true;
  };

  handleDonePlaceFunction = () => {
    this.placingFunction = undefined;
    this.placingFunctionOffset = [0, 0];
    this.functionsInAction = false;
  };

  handleFunctionHover = (funcElement: Element | null) => {
    if (!funcElement) {
      this.functionHoverHighlight = [];
      this.hoveredSubstation = undefined;
      return;
    }

    // If the Function has a PowerSystemRelation Private, resolve the referenced
    // element and highlight that instead of the DOM parent.
    const psrRelationEl = funcElement.getElementsByTagNameNS(
      eTr6100Ns,
      'PowerSystemRelation'
    )[0];
    const relation = psrRelationEl?.getAttribute('relation');
    const target = relation
      ? this.getElementFromProcessPath(relation)
      : funcElement.parentElement;

    if (!target) {
      this.functionHoverHighlight = [];
      this.hoveredSubstation = undefined;
      return;
    }

    if (target.tagName === 'Substation') {
      this.functionHoverHighlight = [];
      this.hoveredSubstation = target;
      return;
    }

    this.hoveredSubstation = undefined;
    this.functionHoverHighlight = [
      {
        id: identity(target).toString(),
        style: SELECTED_PSR_HIGHLIGHT_STYLE,
      },
    ];
  };

  private handleCreateFunctionLink = (context: LNodeSelectionContext) => {
    const bay = context.functionElement.closest('Bay');
    if (!bay) return;

    this.pendingLinkContext = context;
    this.linkSourceCandidates = Array.from(
      bay.querySelectorAll('Function, EqFunction')
    );
    this.selectingLinkSource = true;
    this.showFunctions = true;
  };

  private handleSelectSourceFunction = (sourceFunction: Element) => {
    if (
      !this.selectingLinkSource ||
      !this.linkSourceCandidates.includes(sourceFunction)
    ) {
      return;
    }

    this.selectingLinkSource = false;
    this.functionLinkDialog.showForSourceFunction(sourceFunction, this.doc!);
  };

  private handleEditFunction = (funcElement: Element) => {
    if (this.createFunctionDialog) {
      const parent = funcElement.parentElement;
      this.createFunctionDialog.functionElement = funcElement;
      this.createFunctionDialog.parent = parent;
      this.createFunctionDialog.selectedElementName =
        parent?.getAttribute('name') ?? '';
      this.createFunctionDialog.selectedElementType = parent?.tagName ?? '';
      this.createFunctionDialog.show();
    }
  };

  private resetLinkingState = () => {
    this.selectingLinkSource = false;
    this.linkSourceCandidates = [];
    this.pendingLinkContext = null;
  };

  private handleConnectFunctionLink = (
    e: CustomEvent<CreateFunctionLinkEventDetail>
  ) => {
    if (!this.doc || !this.pendingLinkContext) return;

    const { service, selectedReferences } = e.detail;
    const sinkLNode = this.pendingLinkContext.lNodeElement;
    const nsp =
      this.doc.documentElement.lookupPrefix(eTr6100Ns) ?? eTr6100PrivType;

    if (!this.doc.documentElement.lookupPrefix(eTr6100Ns)) {
      this.doc.documentElement.setAttributeNS(
        xmlnsNs,
        `xmlns:${eTr6100PrivType}`,
        eTr6100Ns
      );
    }

    const edits = buildFunctionLinkEdits({
      doc: this.doc,
      sinkLNode,
      selectedReferences,
      service,
      namespacePrefix: nsp,
    });

    if (!edits.length) {
      this.pendingLinkContext = null;
      return;
    }

    this.dispatchEvent(newEditEventV2(edits));
    this.pendingLinkContext = null;
  };

  private handleSaveInput = (e: CustomEvent<SaveInputDetail>) => {
    try {
      const { context, ...data } = e.detail;
      const edits = buildInputEdits({
        doc: this.doc!,
        sinkLNode: context.lNodeElement,
        ...data,
      });
      this.dispatchEvent(newEditEventV2(edits, { title: 'Add Input' }));
      this.addInputDialog.close();
    } catch (error) {
      this.addInputDialog.reportSaveError(
        error instanceof Error ? error.message : String(error)
      );
    }
  };

  private getElementFromProcessPath(path: string): Element | null {
    if (!this.doc) return null;
    const parts = path.split('/');
    if (!parts.length || !parts[0]) return null;

    let current: Element | null = this.doc.querySelector(
      `:root > Substation[name="${parts[0]}"]`
    );
    for (let i = 1; i < parts.length && current; i += 1) {
      const name = parts[i];
      current =
        Array.from(current.children).find(
          child => child.getAttribute('name') === name
        ) ?? null;
    }
    return current;
  }

  get inAction(): boolean {
    return (
      this.sldEditorInAction || this.functionsInAction || this.addingFunction
    );
  }

  handleSldSelected = (event: CustomEvent<{ element: Element }>) => {
    this.addingFunction = false;
    this.selectedElement = event.detail.element;
    this.highlight = [
      {
        id: identity(event.detail.element).toString(),
        style: SELECTED_PSR_HIGHLIGHT_STYLE,
      },
    ];
    if (this.doc && this.createFunctionDialog) {
      this.createFunctionDialog.parent = this.selectedElement;
      this.createFunctionDialog.selectedElementName =
        this.selectedElement.getAttribute('name') || '';
      this.createFunctionDialog.selectedElementType =
        this.selectedElement.tagName;
      this.createFunctionDialog.show();
    }
  };

  updated(changedProperties: Map<PropertyKey, unknown>) {
    if (changedProperties.has('compasApi')) {
      this.loadLNodeLibrary();
    }

    if (changedProperties.has('doc') && this.doc && !this.lnodeLibrary) {
      this.loadLNodeLibrary();
    }

    if (
      changedProperties.has('doc') ||
      changedProperties.has('gridSize') ||
      changedProperties.has('editCount') ||
      changedProperties.has('addingFunction')
    ) {
      requestAnimationFrame(() => this.calculateSldBounds());
    }

    if (
      changedProperties.has('highlight') ||
      changedProperties.has('functionHoverHighlight') ||
      changedProperties.has('selectedElement') ||
      changedProperties.has('addingFunction') ||
      changedProperties.has('editCount')
    ) {
      requestAnimationFrame(() => this.applyBusbarHighlights());
    }

    if (!changedProperties.has('doc') || !this.doc) return;
    const sldNsPrefix = this.doc.documentElement.lookupPrefix(sldNs);
    if (sldNsPrefix) this.nsp = sldNsPrefix;
    else
      this.doc.documentElement.setAttributeNS(
        xmlnsNs,
        `xmlns:${this.nsp}`,
        sldNs
      );

    [
      'Substation',
      'VoltageLevel',
      'Bay',
      'ConductingEquipment',
      'PowerTransformer',
      'TransformerWinding',
    ].forEach(tag => {
      this.templateElements[tag] = this.doc!.createElementNS(
        this.doc!.documentElement.namespaceURI,
        tag
      );
    });
    this.templateElements.BusBar = makeBusBar(this.doc, this.nsp);
  }

  private calculateSldBounds() {
    if (!this.sldEditor || !this.editorContainer) return;
    const containerRect = this.editorContainer.getBoundingClientRect();
    this.sldBounds = getSldSvgs(this.sldEditor).map(svg => {
      const r = svg.getBoundingClientRect();
      return {
        top: r.top - containerRect.top,
        left: r.left - containerRect.left,
        width: r.width,
        height: r.height,
      };
    });
  }

  private applyBusbarHighlights() {
    if (!this.sldEditor || !this.doc) return;

    const selectedBusbar =
      this.selectedElement && isBusBar(this.selectedElement);
    const shouldHighlight =
      this.addingFunction ||
      this.functionHoverHighlight.length > 0 ||
      selectedBusbar;

    clearBusbarHighlights(this.sldEditor);

    if (!shouldHighlight) {
      return;
    }

    const allHighlights = [...this.highlight, ...this.functionHoverHighlight];
    if (allHighlights.length === 0) return;

    const busbars = Array.from(this.doc.querySelectorAll('Bay')).filter(
      bay =>
        isBusBar(bay) &&
        allHighlights.some(h => h.id === identity(bay).toString())
    );

    if (busbars.length === 0) return;

    // Get the highlight style from the first matching busbar, or use default
    const highlightStyle =
      allHighlights.find(h =>
        busbars.some(bb => identity(bb).toString() === h.id)
      )?.style ?? PSR_HIGHLIGHT_STYLE;

    highlightBusbars(this.sldEditor, busbars, highlightStyle);
  }

  zoomIn() {
    this.gridSize += 3;
  }

  zoomOut() {
    this.gridSize -= 3;
    if (this.gridSize < 2) this.gridSize = 2;
  }

  startPlacing(element: Element | undefined) {
    this.reset();
    this.sldEditor?.startPlacing(element);
  }

  reset() {
    this.sldEditorInAction = false;
    this.functionsInAction = false;
    this.addingFunction = false;
    this.placingFunction = undefined;
    this.placingFunctionOffset = [0, 0];
    this.selectedElement = undefined;
    this.highlight = [];
    this.highlightBeforeAddingFunction = [];
    this.resetLinkingState();

    if (this.sldEditor) {
      clearBusbarHighlights(this.sldEditor);
      this.sldEditor.startPlacing(undefined);
    }
  }

  handleCancelAddFunction = () => {
    this.highlight = [...this.highlightBeforeAddingFunction];
    this.addingFunction = true;
    this.selectedElement = undefined;
  };

  insertSubstation() {
    if (!this.doc) return;
    const parent = this.doc.documentElement;
    const node = this.doc.createElementNS(
      this.doc.documentElement.namespaceURI,
      'Substation'
    );
    const reference = getReference(parent, 'Substation');
    let index = 1;
    while (this.doc.querySelector(`:root > Substation[name="S${index}"]`))
      index += 1;
    node.setAttribute('name', `S${index}`);
    setSLDAttributes(node, this.nsp, { w: '50', h: '25' });
    this.dispatchEvent(newEditEventV2({ parent, node, reference }));
  }

  private handleFunctionDialogSave = (e: CustomEvent<SaveFunctionDetail>) => {
    const { functionElement, ...data } = e.detail;
    if (functionElement) this.updateFunction({ ...data, functionElement });
    else this.createFunction(data);
  };

  createFunction({
    name,
    description,
    type,
    subFunctions,
    lnodes,
  }: FunctionData) {
    if (!this.doc) return;

    const selected = this.selectedElement;
    if (!selected) return;

    const { functionTag, subFunctionTag } = this.resolveFunctionTags(
      selected.tagName
    );

    const func = createElement(this.doc, functionTag, {
      name,
      desc: description,
      type,
    });
    const { x, y } = getFunctionCoordinates(this.doc, selected);
    setSLDAttributes(func, this.nsp, { x: String(x), y: String(y) });

    lnodes.forEach(lnode =>
      func.appendChild(createLNodeFromType(this.doc!, lnode))
    );
    subFunctions.forEach(sf =>
      func.appendChild(createSubFunctionElement(this.doc!, subFunctionTag, sf))
    );

    const reference = getReference(selected, functionTag);
    this.dispatchEvent(
      newEditEventV2(
        { parent: selected, node: func, reference },
        { title: 'Add Function' }
      )
    );
    this.importLNodeTypes([
      ...lnodes,
      ...subFunctions.flatMap(sf => sf.lnodes),
    ]);

    this.reset();
    this.showFunctions = true;
  }

  updateFunction(update: UpdateFunctionData) {
    if (!this.doc) return;

    const { edits, newLNodeTypes } = buildUpdateFunctionEdits(this.doc, update);
    if (edits.length)
      this.dispatchEvent(newEditEventV2(edits, { title: 'Update Function' }));
    this.importLNodeTypes(newLNodeTypes);

    this.reset();
    this.showFunctions = true;
  }

  private importLNodeTypes(lNodeTypes: Element[]) {
    uniqueLNodeTypes(lNodeTypes).forEach(lNodeType => {
      importLNodeType(lNodeType, this.doc!).forEach(edit =>
        this.dispatchEvent(newEditEventV2(edit, { squash: true }))
      );
    });
  }

  private renderTransformerButtons() {
    if (
      !this.doc ||
      !Array.from(this.doc.documentElement.children).find(
        c => c.tagName === 'Substation'
      )
    )
      return nothing;
    return html`<oscd-icon-button
        ?disabled=${this.showFunctions}
        label="Add Single Winding Auto Transformer"
        title="Add Single Winding Auto Transformer"
        @click=${() => {
          const element =
            this.templateElements.PowerTransformer!.cloneNode() as Element;
          element.setAttribute('type', 'PTR');
          setSLDAttributes(element, this.nsp, {
            kind: 'auto',
            rot: '3',
          });
          const winding =
            this.templateElements.TransformerWinding!.cloneNode() as Element;
          winding.setAttribute('type', 'PTW');
          winding.setAttribute('name', 'W1');
          element.appendChild(winding);
          this.startPlacing(element);
        }}
        >${ptrIcon(1, { kind: 'auto' })}</oscd-icon-button
      ><oscd-icon-button
        ?disabled=${this.showFunctions}
        label="Add Two Winding Auto Transformer"
        title="Add Two Winding Auto Transformer"
        @click=${() => {
          const element =
            this.templateElements.PowerTransformer!.cloneNode() as Element;
          element.setAttribute('type', 'PTR');
          setSLDAttributes(element, this.nsp, { kind: 'auto' });
          const windings = [];
          for (let i = 1; i <= 2; i += 1) {
            const winding =
              this.templateElements.TransformerWinding!.cloneNode() as Element;
            winding.setAttribute('type', 'PTW');
            winding.setAttribute('name', `W${i}`);
            windings.push(winding);
          }
          element.append(...windings);
          this.startPlacing(element);
        }}
        >${ptrIcon(2, { kind: 'auto' })}</oscd-icon-button
      ><oscd-icon-button
        ?disabled=${this.showFunctions}
        label="Add Two Winding Transformer"
        title="Add Two Winding Transformer"
        @click=${() => {
          const element =
            this.templateElements.PowerTransformer!.cloneNode() as Element;
          element.setAttribute('type', 'PTR');
          const windings = [];
          for (let i = 1; i <= 2; i += 1) {
            const winding =
              this.templateElements.TransformerWinding!.cloneNode() as Element;
            winding.setAttribute('type', 'PTW');
            winding.setAttribute('name', `W${i}`);
            windings.push(winding);
          }
          element.append(...windings);
          this.startPlacing(element);
        }}
        >${ptrIcon(2)}</oscd-icon-button
      ><oscd-icon-button
        ?disabled=${this.showFunctions}
        label="Add Three Winding Transformer"
        title="Add Three Winding Transformer"
        @click=${() => {
          const element =
            this.templateElements.PowerTransformer!.cloneNode() as Element;
          element.setAttribute('type', 'PTR');
          const windings = [];
          for (let i = 1; i <= 3; i += 1) {
            const winding =
              this.templateElements.TransformerWinding!.cloneNode() as Element;
            winding.setAttribute('type', 'PTW');
            winding.setAttribute('name', `W${i}`);
            windings.push(winding);
          }
          element.append(...windings);
          this.startPlacing(element);
        }}
        >${ptrIcon(3)}</oscd-icon-button
      ><oscd-icon-button
        ?disabled=${this.showFunctions}
        label="Add Single Winding Earthing Transformer"
        title="Add Single Winding Earthing Transformer"
        @click=${() => {
          const element =
            this.templateElements.PowerTransformer!.cloneNode() as Element;
          element.setAttribute('type', 'PTR');
          setSLDAttributes(element, this.nsp, { kind: 'earthing' });
          const winding =
            this.templateElements.TransformerWinding!.cloneNode() as Element;
          winding.setAttribute('type', 'PTW');
          winding.setAttribute('name', 'W1');
          element.appendChild(winding);
          this.startPlacing(element);
        }}
        >${ptrIcon(1, { kind: 'earthing' })}</oscd-icon-button
      ><oscd-icon-button
        ?disabled=${this.showFunctions}
        label="Add Two Winding Earthing Transformer"
        title="Add Two Winding Earthing Transformer"
        @click=${() => {
          const element =
            this.templateElements.PowerTransformer!.cloneNode() as Element;
          element.setAttribute('type', 'PTR');
          setSLDAttributes(element, this.nsp, { kind: 'earthing' });
          const windings = [];
          for (let i = 1; i <= 2; i += 1) {
            const winding =
              this.templateElements.TransformerWinding!.cloneNode() as Element;
            winding.setAttribute('type', 'PTW');
            winding.setAttribute('name', `W${i}`);
            windings.push(winding);
          }
          element.append(...windings);
          this.startPlacing(element);
        }}
        >${ptrIcon(2, { kind: 'earthing' })}</oscd-icon-button
      >`;
  }

  private renderSubstationHighlight() {
    if (!this.doc) return nothing;
    const substations = Array.from(
      this.doc.querySelectorAll(':root > Substation')
    );
    if (!substations.length) return nothing;

    const result = [];

    if (this.addingFunction) {
      result.push(
        ...substations.map((substation, i) => {
          const b = this.sldBounds[i];
          const style = b
            ? `top:${b.top}px;left:${b.left}px;width:${b.width}px;height:${b.height}px`
            : 'inset:0';
          return html`
            <div class="substation-highlight" style="${style}">
              <button
                class="substation-chip"
                title="Select Substation ${substation.getAttribute('name')}"
                @click=${() =>
                  this.handleSldSelected(
                    new CustomEvent('oscd-sld-selected', {
                      detail: { element: substation },
                    })
                  )}
              >
                ${substation.getAttribute('name')}
              </button>
            </div>
          `;
        })
      );
    }

    if (this.hoveredSubstation) {
      const i = substations.indexOf(this.hoveredSubstation);
      const b = this.sldBounds[i];
      const style = b
        ? `top:${b.top}px;left:${b.left}px;width:${b.width}px;height:${b.height}px;z-index:1;background:color-mix(in oklab, var(--bay-template-internal-violet) 50%, transparent);`
        : 'inset:0';
      result.push(
        html`<div class="substation-highlight" style="${style}"></div>`
      );
    }

    return result;
  }

  private renderFunctionButtons() {
    if (!this.doc) return nothing;
    return html`${this.doc.querySelector('VoltageLevel, PowerTransformer')
      ? html`<oscd-icon-button
          id="labels"
          label="Toggle Labels"
          title="Toggle Labels"
          toggle="true"
          @click=${() => this.requestUpdate()}
        >
          <oscd-icon>font_download</oscd-icon>
          <oscd-icon slot="selected">font_download_off</oscd-icon>
        </oscd-icon-button>`
      : nothing}
    ${Array.from(this.doc.documentElement.children).find(
      c => c.tagName === 'Substation'
    )
      ? html`<oscd-icon-button
          ?disabled=${this.showFunctions}
          id="function"
          label="Add Function"
          title="Add Function"
          @click=${() => {
            if (!this.doc) return;
            const elements = PSR_TAGS.flatMap(tag =>
              Array.from(this.doc!.querySelectorAll(tag))
            );
            this.highlight = elements.map(el => ({
              id: identity(el).toString(),
              style: PSR_HIGHLIGHT_STYLE,
            }));
            this.highlightBeforeAddingFunction = [...this.highlight];
            this.addingFunction = true;
            this.showFunctions = true;
          }}
        >
          ${functionAddIcon}
        </oscd-icon-button>`
      : nothing}${this.doc.querySelector('Function, EqFunction')
      ? html`<oscd-icon-button
          id="functions"
          ?selected=${this.showFunctions}
          toggle="true"
          title=${this.showFunctions ? 'Hide Functions' : 'Show Functions'}
          @click=${() => {
            this.showFunctions = !this.showFunctions;
          }}
        >
          ${functionsOffIcon}
          <span slot="selected">${functionsIcon}</span>
        </oscd-icon-button>`
      : nothing}
    ${this.doc.querySelector('Function, EqFunction')
      ? html`<oscd-icon-button
          id="function-links"
          ?selected=${this.showFunctionLinks}
          ?disabled=${!this.showFunctions}
          toggle="true"
          label=${this.showFunctionLinks
            ? 'Hide Function Links'
            : 'Show Function Links'}
          title=${this.showFunctionLinks
            ? 'Hide Function Links'
            : 'Show Function Links'}
          @click=${() => {
            this.showFunctionLinks = !this.showFunctionLinks;
          }}
        >
          <oscd-icon>link_off</oscd-icon>
          <oscd-icon slot="selected">link</oscd-icon>
        </oscd-icon-button>`
      : nothing}${this.doc.querySelector('Substation')
      ? html`<oscd-icon-button
            label="Zoom In"
            title="Zoom In (${Math.round((100 * (this.gridSize + 3)) / 32)}%)"
            @click=${() => this.zoomIn()}
          >
            <oscd-icon>zoom_in</oscd-icon> </oscd-icon-button
          ><oscd-icon-button
            label="Zoom Out"
            ?disabled=${this.gridSize < 4}
            title="Zoom Out (${Math.round((100 * (this.gridSize - 3)) / 32)}%)"
            @click=${() => this.zoomOut()}
          >
            <oscd-icon>zoom_out</oscd-icon>
          </oscd-icon-button>`
      : nothing}${this.inAction
      ? html`<oscd-icon-button
          label="Cancel"
          title="Cancel"
          @click=${() => {
            if (this.addingFunction) {
              this.showFunctions = false;
            }
            this.reset();
          }}
        >
          <oscd-icon>close</oscd-icon>
        </oscd-icon-button>`
      : nothing}`;
  }

  render() {
    return this.doc
      ? html`
          <nav>
            ${Array.from(
              this.doc.querySelectorAll(
                ':root > Substation > VoltageLevel > Bay'
              )
            ).find(bay => !isBusBar(bay))
              ? eqTypes.map(
                  eqType => html`<oscd-icon-button
                    ?disabled=${this.showFunctions}
                    label="Add ${eqType}"
                    title="Add ${eqType}"
                    @click=${() => {
                      const element =
                        this.templateElements.ConductingEquipment!.cloneNode() as Element;
                      element.setAttribute('type', eqType);
                      this.startPlacing(element);
                    }}
                    >${equipmentIcon(eqType)}</oscd-icon-button
                  >`
                )
              : nothing}${this.doc.querySelector(
              ':root > Substation > VoltageLevel'
            )
              ? html`<oscd-icon-button
                    ?disabled=${this.showFunctions}
                    @click=${() => {
                      const element = this.templateElements.BusBar!.cloneNode(
                        true
                      ) as Element;
                      this.startPlacing(element);
                    }}
                    label="Add Bus Bar"
                    title="Add Bus Bar"
                  >
                    <oscd-icon>horizontal_rule</oscd-icon> </oscd-icon-button
                  ><oscd-filled-icon-button
                    ?disabled=${this.showFunctions}
                    id="bay-button"
                    label="Add Bay"
                    title="Add Bay"
                    @click=${() => {
                      const element =
                        this.templateElements.Bay!.cloneNode() as Element;
                      this.startPlacing(element);
                    }}
                  >
                    ${bayIcon}
                  </oscd-filled-icon-button>`
              : nothing}${Array.from(this.doc.documentElement.children).find(
              c => c.tagName === 'Substation'
            )
              ? html`<oscd-filled-icon-button
                  ?disabled=${this.showFunctions}
                  id="voltage-button"
                  label="Add VoltageLevel"
                  title="Add VoltageLevel"
                  @click=${() => {
                    const element =
                      this.templateElements.VoltageLevel!.cloneNode() as Element;
                    this.startPlacing(element);
                  }}
                >
                  ${voltageLevelIcon}
                </oscd-filled-icon-button>`
              : nothing}<oscd-filled-icon-button
              ?disabled=${this.showFunctions}
              id="substation-button"
              @click=${() => this.insertSubstation()}
              label="Add Substation"
              title="Add Substation"
            >
              <oscd-icon>margin</oscd-icon> </oscd-filled-icon-button
            >${this.renderTransformerButtons()}${this.renderFunctionButtons()}
          </nav>
          <div class="editor-container">
            <sld-editor
              .doc=${this.doc}
              .docVersion=${this.editCount}
              .gridSize=${this.gridSize}
              .showLabels=${this.showLabels}
              .disabled=${this.addingFunction || this.showFunctions}
              .highlight=${[...this.highlight, ...this.functionHoverHighlight]}
              .selectable=${this.addingFunction
                ? this.highlight.map(h => h.id)
                : []}
              @sld-editor-in-action=${(e: CustomEvent<boolean>) => {
                this.sldEditorInAction = e.detail;
              }}
              @oscd-sld-selected=${this.handleSldSelected}
            ></sld-editor>
            ${this.renderSubstationHighlight()}
            ${this.showFunctions
              ? Array.from(this.doc.querySelectorAll(':root > Substation')).map(
                  substation => html`<functions-layer
                    .doc=${this.doc}
                    .substation=${substation}
                    .editCount=${this.editCount}
                    .gridSize=${this.gridSize}
                    .nsp=${this.nsp}
                    .placing=${this.placingFunction}
                    .placingOffset=${this.placingFunctionOffset}
                    .onStartPlaceFunction=${this.handleStartPlaceFunction}
                    .onDonePlaceFunction=${this.handleDonePlaceFunction}
                    .onHoverFunction=${this.handleFunctionHover}
                    .onCreateFunctionLink=${this.handleCreateFunctionLink}
                    .onAddInput=${(context: LNodeSelectionContext) =>
                      this.addInputDialog.showForLNode(context)}
                    .onCancelCreateFunctionLink=${this.resetLinkingState}
                    .onSelectSourceFunction=${this.handleSelectSourceFunction}
                    .onEditFunction=${this.handleEditFunction}
                    .linkSourceCandidates=${this.linkSourceCandidates}
                    .selectingLinkSource=${this.selectingLinkSource}
                    .showLinks=${this.showFunctionLinks}
                  ></functions-layer>`
                )
              : nothing}
          </div>
          <create-function-dialog
            .lnodeLibrary=${this.lnodeLibrary}
            @cancel=${this.handleCancelAddFunction}
            @save=${this.handleFunctionDialogSave}
          ></create-function-dialog>
          <function-link-dialog
            @create-function-link=${this.handleConnectFunctionLink}
            @close-function-link-dialog=${this.resetLinkingState}
          ></function-link-dialog>
          <add-input-dialog
            .editCount=${this.editCount}
            @save-input=${this.handleSaveInput}
          ></add-input-dialog>
        `
      : html`<p>Please open an SCL document</p>`;
  }

  static styles = [
    css`
      :host {
        display: block;
        padding: 20px;
        --bay-template-internal-primary: var(--oscd-theme-primary, #2aa198);
        --bay-template-internal-secondary: var(--oscd-theme-secondary, #6c71c4);
        --bay-template-internal-error: var(--oscd-theme-error, #dc322f);
        --bay-template-internal-warning: var(
          --oscd-theme-warning,
          var(--oscd-theme-yellow, #b58900)
        );
        --bay-template-internal-base03: var(
          --oscd-theme-base03,
          light-dark(#002b36, #fdf6e3)
        );
        --bay-template-internal-base02: var(
          --oscd-theme-base02,
          light-dark(#073642, #eee8d5)
        );
        --bay-template-internal-base01: var(
          --oscd-theme-base01,
          light-dark(#586e75, #93a1a1)
        );
        --bay-template-internal-base00: var(
          --oscd-theme-base00,
          light-dark(#657b83, #839496)
        );
        --bay-template-internal-base0: var(
          --oscd-theme-base0,
          light-dark(#839496, #657b83)
        );
        --bay-template-internal-base1: var(
          --oscd-theme-base1,
          light-dark(#93a1a1, #586e75)
        );
        --bay-template-internal-base2: var(
          --oscd-theme-base2,
          light-dark(#eee8d5, #073642)
        );
        --bay-template-internal-base3: var(
          --oscd-theme-base3,
          light-dark(#fdf6e3, #002b36)
        );
        --bay-template-internal-yellow: var(--oscd-theme-yellow, #f5e214);
        --bay-template-internal-red: var(--oscd-theme-red, #bb1326);
        --bay-template-internal-blue: var(--oscd-theme-blue, #12579b);
        --bay-template-internal-violet: var(--oscd-theme-violet, #7821c9);
        --bay-template-internal-text-font: var(
          --oscd-theme-text-font,
          'Roboto'
        );
        --bay-template-internal-text-font-mono: var(
          --oscd-theme-text-font-mono,
          'Roboto Mono'
        );
        --bay-template-internal-icon-font: var(
          --oscd-theme-icon-font,
          'Material Symbols Outlined'
        );
        --bay-template-internal-shape: var(--oscd-theme-shape, 8px);
        --bay-template-internal-shape-none: 0;
        --bay-template-internal-shape-extra-small: calc(
          0.5 * var(--bay-template-internal-shape)
        );
        --bay-template-internal-shape-small: var(--bay-template-internal-shape);
        --bay-template-internal-shape-medium: calc(
          1.5 * var(--bay-template-internal-shape)
        );
        --bay-template-internal-shape-large: calc(
          2 * var(--bay-template-internal-shape)
        );

        --md-sys-color-primary: var(--bay-template-internal-primary);
        --md-sys-color-on-primary: var(--bay-template-internal-base3);
        --md-sys-color-secondary: var(--bay-template-internal-secondary);
        --md-sys-color-on-secondary: var(--bay-template-internal-base3);
        --md-sys-color-tertiary: var(--bay-template-internal-violet);
        --md-sys-color-on-tertiary: var(--bay-template-internal-base3);
        --md-sys-color-error: var(--bay-template-internal-error);
        --md-sys-color-on-error: var(--bay-template-internal-base3);
        --md-sys-color-surface: var(--bay-template-internal-base3);
        --md-sys-color-on-surface: var(--bay-template-internal-base00);
        --md-sys-color-on-surface-variant: var(--bay-template-internal-base00);
        --md-sys-color-surface-variant: var(--bay-template-internal-base2);
        --md-sys-color-surface-container: var(--bay-template-internal-base2);
        --md-sys-color-surface-container-lowest: var(
          --bay-template-internal-base3
        );
        --md-sys-color-surface-container-high: var(
          --bay-template-internal-base2
        );
        --md-sys-color-surface-container-low: var(
          --bay-template-internal-base2
        );
        --md-sys-color-secondary-container: var(--bay-template-internal-base2);
        --md-sys-color-outline-variant: var(--bay-template-internal-base1);
        --md-sys-color-outline: var(--bay-template-internal-base01);
        --md-sys-color-shadow: var(--bay-template-internal-base03);
        --md-sys-color-warning-container: color-mix(
          in oklab,
          var(--bay-template-internal-warning) 20%,
          var(--bay-template-internal-base3)
        );
        --md-sys-color-on-warning-container: var(
          --bay-template-internal-base00
        );
        --md-sys-shape-corner-none: var(--bay-template-internal-shape-none);
        --md-sys-shape-corner-extra-small: var(
          --bay-template-internal-shape-extra-small
        );
        --md-sys-shape-corner-small: var(--bay-template-internal-shape-small);
        --md-sys-shape-corner-medium: var(--bay-template-internal-shape-medium);
        --md-sys-shape-corner-large: var(--bay-template-internal-shape-large);

        --oscd-primary: var(--bay-template-internal-primary);
        --oscd-secondary: var(--bay-template-internal-secondary);
        --oscd-error: var(--bay-template-internal-error);
        --oscd-warning: var(--bay-template-internal-warning);
        --oscd-base03: var(--bay-template-internal-base03);
        --oscd-base02: var(--bay-template-internal-base02);
        --oscd-base01: var(--bay-template-internal-base01);
        --oscd-base00: var(--bay-template-internal-base00);
        --oscd-base0: var(--bay-template-internal-base0);
        --oscd-base1: var(--bay-template-internal-base1);
        --oscd-base2: var(--bay-template-internal-base2);
        --oscd-base3: var(--bay-template-internal-base3);
        --oscd-yellow: var(--bay-template-internal-yellow);
        --oscd-red: var(--bay-template-internal-red);
        --oscd-blue: var(--bay-template-internal-blue);
        --oscd-violet: var(--bay-template-internal-violet);
        --oscd-text-font: var(--bay-template-internal-text-font);
        --oscd-text-font-mono: var(--bay-template-internal-text-font-mono);
        --oscd-icon-font: var(--bay-template-internal-icon-font);
        --oscd-shape: var(--bay-template-internal-shape);
        --md-ref-typeface-plain: var(--oscd-text-font);
        --md-ref-typeface-brand: var(--oscd-text-font);
        --md-icon-font: var(--oscd-icon-font);

        font-family: var(--bay-template-internal-text-font), sans-serif;
        --md-filled-icon-button-container-color: var(
          --bay-template-internal-base2
        );
        --md-filled-icon-button-icon-color: var(--bay-template-internal-base00);
      }
      nav {
        user-select: none;
        position: sticky;
        width: fit-content;
        max-width: calc(100vw - 32px);
        background: var(--bay-template-internal-base3);
        border-radius: var(--bay-template-internal-shape-large);
        margin-bottom: 16px;
        padding: 4px;
        display: flex;
        gap: 4px;
        flex-wrap: wrap;
        z-index: 3;
      }
      #bay-button {
        --md-filled-icon-button-container-color: var(
          --bay-template-internal-blue
        );
        --md-filled-icon-button-icon-color: var(--bay-template-internal-base3);
      }
      #substation-button {
        --md-filled-icon-button-container-color: var(
          --bay-template-internal-red
        );
        --md-filled-icon-button-icon-color: var(--bay-template-internal-base3);
      }
      #voltage-button {
        --md-filled-icon-button-container-color: var(
          --bay-template-internal-yellow
        );
        --md-filled-icon-button-icon-color: var(--bay-template-internal-base03);
        --md-filled-icon-button-hover-icon-color: var(
          --bay-template-internal-base03
        );
        --md-filled-icon-button-pressed-icon-color: var(
          --bay-template-internal-base03
        );
        --md-filled-icon-button-focus-icon-color: var(
          --bay-template-internal-base03
        );
      }
      .editor-container {
        position: relative;
        display: block;
        width: 100%;
        height: 600px;
      }
      sld-editor {
        position: relative;
        display: block;
        width: max-content;
        min-width: 100%;
        height: 100%;
      }
      .substation-highlight {
        position: absolute;
        border: 3px solid var(--bay-template-internal-violet);
        border-radius: 2px;
        box-sizing: border-box;
        pointer-events: none;
        z-index: 2;
      }
      .substation-chip {
        position: absolute;
        top: -40px;
        pointer-events: all;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
        font-family: inherit;
        color: var(--bay-template-internal-violet);
        background: var(--bay-template-internal-base3);
        border: 2px solid var(--bay-template-internal-violet);
        border-radius: var(--bay-template-internal-shape-medium);
        padding: 2px 10px;
        user-select: none;
        line-height: 20px;
      }
      .substation-chip:hover {
        background: color-mix(
          in oklab,
          var(--bay-template-internal-violet) 15%,
          transparent
        );
      }
    `,
  ];
}
