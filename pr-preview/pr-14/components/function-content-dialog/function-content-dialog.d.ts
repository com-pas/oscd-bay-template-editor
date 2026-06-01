import { LitElement } from 'lit';
import { OscdDialog } from '@omicronenergy/oscd-ui/dialog/OscdDialog.js';
import { OscdFilledButton } from '@omicronenergy/oscd-ui/button/OscdFilledButton.js';
import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
import { OscdIconButton } from '@omicronenergy/oscd-ui/iconbutton/OscdIconButton.js';
import { OscdDivider } from '@omicronenergy/oscd-ui/divider/OscdDivider.js';
import { OscdList } from '@omicronenergy/oscd-ui/list/OscdList.js';
import { OscdListItem } from '@omicronenergy/oscd-ui/list/OscdListItem.js';
declare const FunctionContentDialog_base: typeof LitElement & import("@open-wc/scoped-elements/lit-element.js").ScopedElementsHostConstructor;
export declare class FunctionContentDialog extends FunctionContentDialog_base {
    static get scopedElements(): {
        'oscd-dialog': typeof OscdDialog;
        'oscd-filled-button': typeof OscdFilledButton;
        'oscd-icon': typeof OscdIcon;
        'oscd-icon-button': typeof OscdIconButton;
        'oscd-divider': typeof OscdDivider;
        'oscd-list': typeof OscdList;
        'oscd-list-item': typeof OscdListItem;
    };
    functionName: string;
    functionDescription: string | null;
    functionType: string | null;
    selectedElementName: string;
    selectedElementType: string;
    dialog: OscdDialog;
    show(): void;
    close(): void;
    cancel(): void;
    private handleSave;
    render(): import("lit-html").TemplateResult<1>;
    static readonly styles: import("lit").CSSResult;
}
export {};
