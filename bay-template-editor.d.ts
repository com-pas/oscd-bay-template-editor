import { LitElement } from 'lit';
import '@material/mwc-fab';
import type { SldEditor } from '@omicronenergy/oscd-editor-sld/dist/sld-editor.js';
import type { IconButtonToggle } from '@material/mwc-icon-button-toggle';
import '@omicronenergy/oscd-editor-sld/dist/sld-editor.js';
/** An editor [[`plugin`]] for creating bay templates using single line diagrams */
export default class BayTemplatePlugin extends LitElement {
    doc?: XMLDocument;
    editCount: number;
    gridSize: number;
    sldEditor?: SldEditor;
    get showLabels(): boolean;
    labelToggle?: IconButtonToggle;
    inAction: boolean;
    templateElements: Record<string, Element>;
    nsp: string;
    connectedCallback(): void;
    disconnectedCallback(): void;
    private preprocessEdits;
    updated(changedProperties: Map<string, any>): void;
    zoomIn(): void;
    zoomOut(): void;
    startPlacing(element: Element | undefined): void;
    reset(): void;
    insertSubstation(): void;
    render(): import("lit-html").TemplateResult<1>;
    static styles: import("lit").CSSResult[];
}
