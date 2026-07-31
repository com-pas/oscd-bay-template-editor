import { LitElement, nothing } from 'lit';
import { OscdList } from '@omicronenergy/oscd-ui/list/OscdList.js';
import { OscdListItem } from '@omicronenergy/oscd-ui/list/OscdListItem.js';
import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
import { OscdIconButton } from '@omicronenergy/oscd-ui/iconbutton/OscdIconButton.js';
import { OscdFilledButton } from '@omicronenergy/oscd-ui/button/OscdFilledButton.js';
export interface LNodeSelectionContext {
    functionElement: Element;
    subFunctionElement: Element | null;
    lNodeElement: Element;
}
declare const FunctionContentPanel_base: typeof LitElement & import("@open-wc/dedupe-mixin").Constructor<import("@open-wc/scoped-elements/types.js").ScopedElementsHost> & import("@open-wc/scoped-elements/types.js").ScopedElementsHostConstructor;
export declare class FunctionContentPanel extends FunctionContentPanel_base {
    static get scopedElements(): {
        'oscd-list': typeof OscdList;
        'oscd-list-item': typeof OscdListItem;
        'oscd-icon': typeof OscdIcon;
        'oscd-icon-button': typeof OscdIconButton;
        'oscd-filled-button': typeof OscdFilledButton;
    };
    functionElement?: Element;
    selectingLinkSource: boolean;
    private selectedLNode?;
    private selectedSubFunction;
    private resetLinkSelectionUi;
    updated(changedProperties: Map<string, unknown>): void;
    private getSubFunctions;
    private getFunctionLNodes;
    private getLNodes;
    private isSelectedLNode;
    private selectLNode;
    private dispatchCancelCreateFunctionLink;
    private dispatchStartCreateFunctionLink;
    private handleCreateFunctionLinkClick;
    private handleCancelFunctionLinkClick;
    private handleCloseClick;
    private renderLNodeLinkActions;
    private renderLNodeItem;
    render(): typeof nothing | import("lit-html").TemplateResult<1>;
    static styles: import("lit").CSSResult;
}
export {};
