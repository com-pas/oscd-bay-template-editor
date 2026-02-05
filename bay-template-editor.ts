/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { LitElement, html, css, nothing } from 'lit';
import { property, state, query } from 'lit/decorators.js';
import { getReference } from '@openscd/scl-lib';
import { newEditEventV2 } from '@openscd/oscd-api/utils.js';
import '@material/mwc-fab';

import type { SldEditor } from '@omicronenergy/oscd-editor-sld/dist/sld-editor.js';
import type { IconButtonToggle } from '@material/mwc-icon-button-toggle';
import { bayIcon, equipmentIcon, ptrIcon, voltageLevelIcon } from './icons.js';
import {
  eqTypes,
  isBusBar,
  makeBusBar,
  setSLDAttributes,
  sldNs,
  uniqueName,
  xmlnsNs,
} from './util.js';

import '@omicronenergy/oscd-editor-sld/dist/sld-editor.js';

/** An editor [[`plugin`]] for creating bay templates using single line diagrams */
export default class BayTemplatePlugin extends LitElement {
  @property({ attribute: false })
  doc?: XMLDocument;

  @property({ type: Number })
  editCount = -1;

  @property({ type: Number })
  gridSize: number = 24;

  @query('sld-editor') sldEditor?: SldEditor;

  @state()
  get showLabels(): boolean {
    if (this.labelToggle) return this.labelToggle.on;
    return true;
  }

  @query('#labels') labelToggle?: IconButtonToggle;

  @state()
  inAction: boolean = false;

  @state()
  templateElements: Record<string, Element> = {};

  @state()
  nsp = 'eosld';

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('oscd-edit-v2', this.preprocessEdits, {
      capture: true,
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('oscd-edit-v2', this.preprocessEdits, {
      capture: true,
    });
  }

  private preprocessEdits = (event: Event) => {
    const editEvent = event as CustomEvent;
    let edits = Array.isArray(editEvent.detail)
      ? editEvent.detail
      : [editEvent.detail];

    edits = edits.flatMap((e: any) => (e.edit ? e.edit : e));

    edits.forEach((edit: any, index: number) => {
      if (edit.node && edit.parent && !edit.node.getAttribute('name')) {
        const name = uniqueName(edit.node, edit.parent);
        edit.node.setAttribute('name', name);
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
        // eslint-disable-next-line no-param-reassign
        delete edit.attributesNS;
      }
    });
  };

  updated(changedProperties: Map<string, any>) {
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
    this.inAction = false;
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

  render() {
    return html`
      <nav>
        ${
          this.doc &&
          Array.from(
            this.doc.querySelectorAll(':root > Substation > VoltageLevel > Bay')
          ).find(bay => !isBusBar(bay))
            ? eqTypes
                .map(
                  eqType => html`<mwc-fab
                    mini
                    label="Add ${eqType}"
                    title="Add ${eqType}"
                    @click=${() => {
                      const element =
                        this.templateElements.ConductingEquipment!.cloneNode() as Element;
                      element.setAttribute('type', eqType);
                      this.startPlacing(element);
                    }}
                    >${equipmentIcon(eqType)}</mwc-fab
                  >`
                )
                .concat()
            : nothing
        }${
      this.doc && this.doc.querySelector(':root > Substation > VoltageLevel')
        ? html`<mwc-fab
              mini
              icon="horizontal_rule"
              @click=${() => {
                const element = this.templateElements.BusBar!.cloneNode(
                  true
                ) as Element;
                this.startPlacing(element);
              }}
              label="Add Bus Bar"
              title="Add Bus Bar"
            >
            </mwc-fab
            ><mwc-fab
              mini
              label="Add Bay"
              title="Add Bay"
              @click=${() => {
                const element =
                  this.templateElements.Bay!.cloneNode() as Element;
                this.startPlacing(element);
              }}
              style="--mdc-theme-secondary: #12579B; --mdc-theme-on-secondary: white;"
            >
              ${bayIcon}
            </mwc-fab>`
        : nothing
    }${
      this.doc &&
      Array.from(this.doc.documentElement.children).find(
        c => c.tagName === 'Substation'
      )
        ? html`<mwc-fab
            mini
            label="Add VoltageLevel"
            title="Add VoltageLevel"
            @click=${() => {
              const element =
                this.templateElements.VoltageLevel!.cloneNode() as Element;
              this.startPlacing(element);
            }}
            style="--mdc-theme-secondary: #F5E214;"
          >
            ${voltageLevelIcon}
          </mwc-fab>`
        : nothing
    }<mwc-fab
          mini
          icon="margin"
          @click=${() => this.insertSubstation()}
          label="Add Substation"
          style="--mdc-theme-secondary: #BB1326; --mdc-theme-on-secondary: white;"
          title="Add Substation"
        >
        </mwc-fab
        >${
          this.doc &&
          Array.from(this.doc.documentElement.children).find(
            c => c.tagName === 'Substation'
          )
            ? html`<mwc-fab
                  mini
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
                  >${ptrIcon(1, { kind: 'auto' })}</mwc-fab
                ><mwc-fab
                  mini
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
                  >${ptrIcon(2, { kind: 'auto' })}</mwc-fab
                ><mwc-fab
                  mini
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
                  >${ptrIcon(2)}</mwc-fab
                ><mwc-fab
                  mini
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
                  >${ptrIcon(3)}</mwc-fab
                ><mwc-fab
                  mini
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
                  >${ptrIcon(1, { kind: 'earthing' })}</mwc-fab
                ><mwc-fab
                  mini
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
                  >${ptrIcon(2, { kind: 'earthing' })}</mwc-fab
                >`
            : nothing
        }${
      this.doc?.querySelector('VoltageLevel, PowerTransformer')
        ? html`<mwc-icon-button-toggle
            id="labels"
            label="Toggle Labels"
            title="Toggle Labels"
            on
            onIcon="font_download"
            offIcon="font_download_off"
            @click=${() => this.requestUpdate()}
          ></mwc-icon-button-toggle>`
        : nothing
    }${
      this.doc?.querySelector('Substation')
        ? html`<mwc-icon-button
              icon="zoom_in"
              label="Zoom In"
              title="Zoom In (${Math.round((100 * (this.gridSize + 3)) / 32)}%)"
              @click=${() => this.zoomIn()}
            >
            </mwc-icon-button
            ><mwc-icon-button
              icon="zoom_out"
              label="Zoom Out"
              ?disabled=${this.gridSize < 4}
              title="Zoom Out (${Math.round(
                (100 * (this.gridSize - 3)) / 32
              )}%)"
              @click=${() => this.zoomOut()}
            ></mwc-icon-button>`
        : nothing
    }
        </mwc-icon-button
        >${
          this.inAction
            ? html`<mwc-icon-button
                icon="close"
                label="Cancel"
                title="Cancel"
                @click=${() => this.reset()}
              ></mwc-icon-button>`
            : nothing
        }
      </nav>
      ${
        this.doc
          ? html`<sld-editor
              .doc=${this.doc}
              .docVersion=${this.editCount}
              .gridSize=${this.gridSize}
              .showLabels=${this.showLabels}
              @sld-editor-in-action=${(e: CustomEvent<boolean>) => {
                this.inAction = e.detail;
              }}
            ></sld-editor>`
          : html`<p>Please open an SCL document</p>`
      }
    `;
  }

  static styles = [
    css`
      :host {
        display: block;
        padding: 20px;
        font-family: var(--oscd-theme-text-font, 'Roboto'), sans-serif;
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
        z-index: 1;
        margin-bottom: 16px;
        padding: 4px;
        display: flex;
        flex-wrap: wrap;
      }

      mwc-fab {
        --mdc-theme-secondary: #fff;
        --mdc-theme-on-secondary: rgb(0, 0, 0 / 0.83);
      }
      sld-editor {
        position: relative;
        display: block;
        width: 100%;
        height: 600px;
        border: 1px solid #ccc;
        margin-top: 24px;
      }
    `,
  ];
}
