import { LitElement } from 'lit';
import { OscdDialog } from '@omicronenergy/oscd-ui/dialog/OscdDialog.js';
import { OscdFilledButton } from '@omicronenergy/oscd-ui/button/OscdFilledButton.js';
import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
declare const ConfirmDialog_base: typeof LitElement & import("@open-wc/scoped-elements/lit-element.js").ScopedElementsHostConstructor;
/**
 * A reusable confirmation dialog component.
 *
 * @fires confirm-dialog-confirm - Fired when the user confirms the action.
 * @fires confirm-dialog-cancel  - Fired when the user cancels or dismisses the dialog.
 *
 */
export declare class ConfirmDialog extends ConfirmDialog_base {
    static get scopedElements(): {
        'oscd-dialog': typeof OscdDialog;
        'oscd-filled-button': typeof OscdFilledButton;
        'oscd-icon': typeof OscdIcon;
    };
    headline: string;
    description: string;
    confirmLabel: string;
    cancelLabel: string;
    icon: string;
    variant: 'danger' | 'warning' | 'primary';
    private readonly dialog;
    show(): void;
    close(): void;
    private handleConfirm;
    private handleCancel;
    render(): import("lit-html").TemplateResult<1>;
    static readonly styles: import("lit").CSSResult;
}
export {};
