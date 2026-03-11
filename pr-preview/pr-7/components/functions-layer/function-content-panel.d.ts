import { LitElement, nothing } from 'lit';
import { OscdList } from '@omicronenergy/oscd-ui/list/OscdList.js';
import { OscdListItem } from '@omicronenergy/oscd-ui/list/OscdListItem.js';
import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
import { OscdIconButton } from '@omicronenergy/oscd-ui/iconbutton/OscdIconButton.js';
declare const FunctionContentPanel_base: typeof LitElement & import("@open-wc/scoped-elements/lit-element.js").ScopedElementsHostConstructor;
/**
 * Displays the structure of a Function element: SubFunctions and LNodes.
 * Usage: <function-content-panel .functionElement=${Element}>
 */
export declare class FunctionContentPanel extends FunctionContentPanel_base {
    static get scopedElements(): {
        'oscd-list': typeof OscdList;
        'oscd-list-item': typeof OscdListItem;
        'oscd-icon': typeof OscdIcon;
        'oscd-icon-button': typeof OscdIconButton;
    };
    functionElement?: Element;
    private getSubFunctions;
    private getFunctionLNodes;
    private getLNodes;
    render(): typeof nothing | import("lit-html").TemplateResult<1>;
    static styles: import("lit").CSSResult;
}
export {};
