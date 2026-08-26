import { LitElement } from 'lit';
import { OscdFilledIconButton } from '@omicronenergy/oscd-ui/iconbutton/OscdFilledIconButton.js';
import { OscdOutlinedIconButton } from '@omicronenergy/oscd-ui/iconbutton/OscdOutlinedIconButton.js';
import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
import { SldEditor } from '@omicronenergy/oscd-editor-sld/sld-editor.js';
import { type SubfunctionData } from './util.js';
import { FunctionsLayer } from './components/functions-layer/functions-layer.js';
import { CreateFunctionDialog } from './components/create-function-dialog/create-function-dialog.js';
import { FunctionLinkDialog } from './components/function-link-dialog/function-link-dialog.js';
import { type HighlightStyle } from './const.js';
declare const BayTemplatePlugin_base: typeof LitElement & import("@open-wc/dedupe-mixin").Constructor<import("@open-wc/scoped-elements/types.js").ScopedElementsHost> & import("@open-wc/scoped-elements/types.js").ScopedElementsHostConstructor;
/** An editor [[`plugin`]] for creating bay templates using single line diagrams */
export default class BayTemplatePlugin extends BayTemplatePlugin_base {
    static get scopedElements(): {
        'oscd-icon-button': typeof OscdOutlinedIconButton;
        'oscd-filled-icon-button': typeof OscdFilledIconButton;
        'oscd-icon': typeof OscdIcon;
        'functions-layer': typeof FunctionsLayer;
        'sld-editor': typeof SldEditor;
        'create-function-dialog': typeof CreateFunctionDialog;
        'function-link-dialog': typeof FunctionLinkDialog;
    };
    doc?: XMLDocument;
    editCount: number;
    gridSize: number;
    compasApi?: {
        lNodeLibrary: {
            loadLNodeLibrary: () => Promise<Document | null>;
            lNodeLibrary: () => Document | null;
        };
    };
    sldEditor?: SldEditor;
    editorContainer?: HTMLElement;
    labelToggle?: OscdOutlinedIconButton;
    createFunctionDialog?: CreateFunctionDialog;
    functionLinkDialog: FunctionLinkDialog;
    sldEditorInAction: boolean;
    functionsInAction: boolean;
    addingFunction: boolean;
    showFunctions: boolean;
    templateElements: Record<string, Element>;
    nsp: string;
    placingFunction?: Element;
    placingFunctionOffset: [number, number];
    highlight: {
        id: string;
        style: HighlightStyle;
    }[];
    functionHoverHighlight: {
        id: string;
        style: HighlightStyle;
    }[];
    highlightBeforeAddingFunction: {
        id: string;
        style: HighlightStyle;
    }[];
    private hoveredSubstation?;
    selectedElement?: Element;
    private sldBounds;
    private linkSourceCandidates;
    private selectingLinkSource;
    private lnodeLibrary;
    private pendingLinkContext;
    private readonly onResize;
    private readonly eqFunctionHostTags;
    private resolveFunctionTags;
    get showLabels(): boolean;
    private loadLNodeLibrary;
    connectedCallback(): void;
    disconnectedCallback(): void;
    private handleKeydown;
    handleStartPlaceFunction: (element: Element, offset: [number, number]) => void;
    handleDonePlaceFunction: () => void;
    handleFunctionHover: (funcElement: Element | null) => void;
    private handleCreateFunctionLink;
    private handleSelectSourceFunction;
    private resetLinkingState;
    private handleConnectFunctionLink;
    private getElementFromProcessPath;
    get inAction(): boolean;
    handleSldSelected: (event: CustomEvent<{
        element: Element;
    }>) => void;
    updated(changedProperties: Map<PropertyKey, unknown>): void;
    private calculateSldBounds;
    private applyBusbarHighlights;
    zoomIn(): void;
    zoomOut(): void;
    startPlacing(element: Element | undefined): void;
    reset(): void;
    handleCancelAddFunction: () => void;
    insertSubstation(): void;
    createFunction(e: CustomEvent<{
        name: string;
        description: string | null;
        type: string | null;
        subfunctions: SubfunctionData[];
        lnodes: Element[];
    }>): void;
    private renderTransformerButtons;
    private renderSubstationHighlight;
    private renderFunctionButtons;
    render(): import("lit-html").TemplateResult<1>;
    static styles: import("lit").CSSResult[];
}
export {};
