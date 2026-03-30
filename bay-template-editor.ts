/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { LitElement, html, css, nothing } from 'lit';
import { property, state, query } from 'lit/decorators.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';
import { getReference, identity } from '@openscd/scl-lib';
import { newEditEventV2 } from '@openscd/oscd-api/utils.js';
import { createElement } from '@compas-oscd/xml';
import { OscdFilledIconButton } from '@omicronenergy/oscd-ui/iconbutton/OscdFilledIconButton.js';
import { OscdOutlinedIconButton } from '@omicronenergy/oscd-ui/iconbutton/OscdOutlinedIconButton.js';
import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';

import '@omicronenergy/oscd-editor-sld/dist/sld-editor.js';
import type { SldEditor } from '@omicronenergy/oscd-editor-sld/dist/sld-editor.js';
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
  uniqueName,
  xmlnsNs,
  getFunctionCoordinates,
  getProcessPath,
  createPowerSystemRelationPrivate,
  getSldSvgs,
  eTr6100Ns,
} from './util.js';
import { FunctionsLayer } from './components/functions-layer/functions-layer.js';
import { CreateFunctionDialog } from './components/create-function-dialog/create-function-dialog.js';
import {
  PSR_TAGS,
  PSR_HIGHLIGHT_STYLE,
  SELECTED_PSR_HIGHLIGHT_STYLE,
  type HighlightStyle,
} from './const.js';

/** An editor [[`plugin`]] for creating bay templates using single line diagrams */
export default class BayTemplatePlugin extends ScopedElementsMixin(LitElement) {
  static get scopedElements() {
    return {
      'oscd-icon-button': OscdOutlinedIconButton,
      'oscd-filled-icon-button': OscdFilledIconButton,
      'oscd-icon': OscdIcon,
      'functions-layer': FunctionsLayer,
      'sld-editor': customElements.get('sld-editor')!,
      'create-function-dialog': CreateFunctionDialog,
    };
  }

  @property({ attribute: false })
  doc?: XMLDocument;

  @property({ type: Number })
  editCount = -1;

  @property({ type: Number })
  gridSize: number = 24;

  @query('sld-editor') sldEditor?: SldEditor;

  @query('.editor-container') editorContainer?: HTMLElement;

  @query('#labels') labelToggle?: OscdOutlinedIconButton;

  @query('create-function-dialog') createFunctionDialog?: CreateFunctionDialog;

  @state()
  sldEditorInAction: boolean = false;

  @state()
  functionsInAction: boolean = false;

  @state()
  addingFunction: boolean = false;

  @state()
  showFunctions: boolean = false;

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

  private readonly onResize = () => this.calculateSldBounds();

  get showLabels(): boolean {
    if (this.labelToggle) return !this.labelToggle.selected;
    return true;
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('oscd-edit-v2', this.preprocessEdits, {
      capture: true,
    });
    window.addEventListener('keydown', this.handleKeydown);
    window.addEventListener('resize', this.onResize);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('oscd-edit-v2', this.preprocessEdits, {
      capture: true,
    });
    window.removeEventListener('keydown', this.handleKeydown);
    window.removeEventListener('resize', this.onResize);
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

  // TODO: Remove this workaround once the official oscd-editor is integrated in open-scd (https://github.com/com-pas/open-scd/issues/25).
  // Currently, edits with only attributesNS are not processed by the open-scd edit handler.
  // This preprocessing mutates the edit object to apply the attributes directly and removes attributesNS.
  private preprocessEdits = (event: Event) => {
    const editEvent = event as CustomEvent;
    let edits = Array.isArray(editEvent.detail)
      ? editEvent.detail
      : [editEvent.detail];

    edits = edits.flatMap((e: any) => (e.edit ? e.edit : e));

    edits.forEach((edit: any) => {
      if (
        edit.node &&
        edit.parent &&
        !edit.node.getAttribute('name') &&
        edit.node.tagName !== 'Private'
      ) {
        const name = uniqueName(edit.node, edit.parent);
        edit.node.setAttribute('name', name);
      }

      // Ensure attributesNS exists as an object if element has attributes
      if (edit.attributes && !edit.attributesNS) {
        // eslint-disable-next-line no-param-reassign
        edit.attributesNS = {};
      }

      if (edit.element && edit.attributesNS?.[sldNs]) {
        const attrs = edit.attributesNS[sldNs];
        const cleanAttrs: Record<string, string> = {};
        Object.entries(attrs).forEach(([key, value]) => {
          const localName = key.includes(':') ? key.split(':')[1] : key;
          if (value !== null) cleanAttrs[localName] = value as string;
        });

        if (edit.element.localName === 'SLDAttributes') {
          Object.entries(cleanAttrs).forEach(([key, value]) => {
            edit.element.setAttributeNS(sldNs, `${this.nsp}:${key}`, value);
          });
        } else {
          setSLDAttributes(edit.element, this.nsp, cleanAttrs);
        }
      }
    });

    if (this.placingFunction) {
      this.placingFunction = undefined;
      this.placingFunctionOffset = [0, 0];
      this.functionsInAction = false;
    }
  };

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
      this.createFunctionDialog.show();
    }
  };

  updated(changedProperties: Map<PropertyKey, unknown>) {
    if (
      changedProperties.has('doc') ||
      changedProperties.has('gridSize') ||
      changedProperties.has('editCount') ||
      changedProperties.has('addingFunction')
    ) {
      requestAnimationFrame(() => this.calculateSldBounds());
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

    this.sldEditor?.resetWithOffset();
  }

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

  // eslint-disable-next-line class-methods-use-this
  private getFunctionParent(selected: Element): Element | null {
    const { tagName } = selected;
    if (
      tagName === 'Bay' ||
      tagName === 'VoltageLevel' ||
      tagName === 'Substation'
    ) {
      return selected;
    }
    if (tagName === 'ConductingEquipment') {
      return selected.closest('Bay');
    }
    if (tagName === 'PowerTransformer' || tagName === 'TransformerWinding') {
      return selected.closest('Bay, VoltageLevel, Substation');
    }
    return null;
  }

  createFunction(
    e: CustomEvent<{
      name: string;
      description: string | null;
      type: string | null;
    }>
  ) {
    const { name, description, type } = e.detail;
    if (!this.doc || !this.selectedElement) return;

    const selected = this.selectedElement;
    const { tagName } = selected;
    const functionParent = this.getFunctionParent(selected);
    if (!functionParent) return;

    const func = createElement(this.doc, 'Function', {
      name,
      desc: description,
      type,
    });

    if (tagName === 'ConductingEquipment') {
      const path = getProcessPath(selected);
      func.appendChild(createPowerSystemRelationPrivate(this.doc, path));
    } else if (
      tagName === 'PowerTransformer' ||
      tagName === 'TransformerWinding'
    ) {
      const powerTransformer =
        tagName === 'PowerTransformer' ? selected : selected.parentElement;
      if (powerTransformer) {
        const path = getProcessPath(powerTransformer);
        func.appendChild(createPowerSystemRelationPrivate(this.doc, path));
      }
    }

    const { x, y } = getFunctionCoordinates(this.doc, selected);
    setSLDAttributes(func, this.nsp, {
      x: String(x),
      y: String(y),
    });

    const reference = getReference(functionParent, 'Function');
    this.dispatchEvent(
      newEditEventV2({ parent: functionParent, node: func, reference })
    );

    this.reset();
    this.showFunctions = true;
    this.createFunctionDialog?.close();
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
        ? `top:${b.top}px;left:${b.left}px;width:${b.width}px;height:${b.height}px;z-index:1;background:rgba(210,185,236,0.5);`
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
            this.addingFunction = true;
            this.showFunctions = true;
          }}
        >
          ${functionAddIcon}
        </oscd-icon-button>`
      : nothing}${this.doc.querySelector('Function')
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
                    .onHoverFunction=${this.handleFunctionHover}
                  ></functions-layer>`
                )
              : nothing}
          </div>
          <create-function-dialog
            @cancel=${this.reset}
            @save=${this.createFunction}
          ></create-function-dialog>
        `
      : html`<p>Please open an SCL document</p>`;
  }

  static styles = [
    css`
      :host {
        display: block;
        padding: 20px;
        font-family: var(--oscd-theme-text-font, 'Roboto'), sans-serif;
        --md-filled-icon-button-container-color: var(
          --oscd-theme-base1,
          #e0e0e0
        );
        --md-filled-icon-button-icon-color: var(
          --oscd-theme-on-surface,
          #000000
        );
      }
      nav {
        user-select: none;
        position: sticky;
        top: 68px;
        left: 16px;
        width: fit-content;
        max-width: calc(100vw - 32px);
        background: #fffd;
        border-radius: 24px;
        margin-bottom: 16px;
        padding: 4px;
        display: flex;
        gap: 4px;
        flex-wrap: wrap;
        z-index: 3;
      }
      #bay-button {
        --md-filled-icon-button-container-color: #12579b;
        --md-filled-icon-button-icon-color: white;
      }
      #substation-button {
        --md-filled-icon-button-container-color: #bb1326;
        --md-filled-icon-button-icon-color: white;
      }
      #voltage-button {
        --md-filled-icon-button-container-color: #f5e214;
        --md-filled-icon-button-icon-color: black;
        --md-filled-icon-button-hover-icon-color: black;
        --md-filled-icon-button-pressed-icon-color: black;
        --md-filled-icon-button-focus-icon-color: black;
      }
      .editor-container {
        position: relative;
        display: block;
        width: 100%;
        height: 600px;
        margin-top: 24px;
      }
      sld-editor {
        position: relative;
        display: block;
        max-width: 100%;
        height: 100%;
      }
      .substation-highlight {
        position: absolute;
        border: 3px solid #7821c9;
        border-radius: 2px;
        box-sizing: border-box;
        pointer-events: none;
        z-index: 10;
      }
      .substation-chip {
        position: absolute;
        top: -40px;
        pointer-events: all;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
        font-family: inherit;
        color: #7821c9;
        background: rgba(210, 185, 236, 0.9);
        border: 2px solid #7821c9;
        border-radius: 12px;
        padding: 2px 10px;
        user-select: none;
        line-height: 20px;
      }
      .substation-chip:hover {
        background: rgba(120, 33, 201, 0.15);
      }
    `,
  ];
}
