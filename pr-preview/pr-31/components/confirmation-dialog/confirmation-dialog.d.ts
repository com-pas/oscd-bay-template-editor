import { LitElement } from 'lit';
import { OscdDialog } from '@omicronenergy/oscd-ui/dialog/OscdDialog.js';
import { OscdFilledButton } from '@omicronenergy/oscd-ui/button/OscdFilledButton.js';
import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
export interface ConfirmDialogOptions {
    headline?: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    icon?: string;
    variant?: 'danger' | 'warning' | 'primary';
}
declare const ConfirmDialog_base: typeof LitElement & import("@open-wc/dedupe-mixin").Constructor<import("@open-wc/scoped-elements/types.js").ScopedElementsHost> & import("@open-wc/scoped-elements/types.js").ScopedElementsHostConstructor;
/**
 * A reusable confirmation dialog component.
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
    private resolveShow;
    show(options?: ConfirmDialogOptions): Promise<boolean>;
    close(): void;
    private resolveAndClose;
    private handleConfirm;
    private handleCancel;
    private handleCancelClick;
    render(): import("lit-html").TemplateResult<1>;
    static readonly styles: import("lit").CSSResult;
}
export {};
