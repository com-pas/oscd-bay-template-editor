import { LitElement } from 'lit';
import { OscdFilledIconButton } from '@omicronenergy/oscd-ui/iconbutton/OscdFilledIconButton.js';
import { OscdOutlinedIconButton } from '@omicronenergy/oscd-ui/iconbutton/OscdOutlinedIconButton.js';
import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
import '@omicronenergy/oscd-editor-sld/dist/sld-editor.js';
import type { SldEditor } from '@omicronenergy/oscd-editor-sld/dist/sld-editor.js';
import { FunctionsLayer } from './components/functions-layer.js';
declare const BayTemplatePlugin_base: typeof LitElement & import("@open-wc/scoped-elements/lit-element.js").ScopedElementsHostConstructor;
/** An editor [[`plugin`]] for creating bay templates using single line diagrams */
export default class BayTemplatePlugin extends BayTemplatePlugin_base {
    static get scopedElements(): {
        'oscd-icon-button': typeof OscdOutlinedIconButton;
        'oscd-filled-icon-button': typeof OscdFilledIconButton;
        'oscd-icon': typeof OscdIcon;
        'functions-layer': typeof FunctionsLayer;
        'sld-editor': CustomElementConstructor;
    };
    doc?: XMLDocument;
    editCount: number;
    gridSize: number;
    sldEditor?: SldEditor;
    labelToggle?: OscdOutlinedIconButton;
    get showLabels(): boolean;
    inAction: boolean;
    sldEditorInAction: boolean;
    functionsInAction: boolean;
    showFunctions: boolean;
    templateElements: Record<string, Element>;
    nsp: string;
    placingFunction?: Element;
    placingFunctionOffset: [number, number];
    connectedCallback(): void;
    disconnectedCallback(): void;
    private handleKeydown;
    handleStartPlaceFunction: (element: Element, offset: [number, number]) => void;
    updateInAction(): void;
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
export {};
