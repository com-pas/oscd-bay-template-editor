import { LitElement } from 'lit';
import { OscdDialog } from '@omicronenergy/oscd-ui/dialog/OscdDialog.js';
import { OscdFilledButton } from '@omicronenergy/oscd-ui/button/OscdFilledButton.js';
import { OscdFilledTextField } from '@omicronenergy/oscd-ui/textfield/OscdFilledTextField.js';
import { OscdSclTextField } from '@omicronenergy/oscd-ui/scl-textfield/OscdSclTextField.js';
import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
import { OscdIconButton } from '@omicronenergy/oscd-ui/iconbutton/OscdIconButton.js';
import { OscdDivider } from '@omicronenergy/oscd-ui/divider/OscdDivider.js';
import { OscdList } from '@omicronenergy/oscd-ui/list/OscdList.js';
import { OscdListItem } from '@omicronenergy/oscd-ui/list/OscdListItem.js';
import type { SubfunctionData } from '../../util.js';
import { ConfirmDialog } from '../confirmation-dialog/confirmation-dialog.js';
export declare enum CreateSubfunctionDialogStep {
    SubfunctionAttributes = "subfunction-attributes",
    SubfunctionContent = "subfunction-content"
}
declare const CreateSubfunctionDialog_base: typeof LitElement & import("@open-wc/scoped-elements/lit-element.js").ScopedElementsHostConstructor;
export declare class CreateSubfunctionDialog extends CreateSubfunctionDialog_base {
    static get scopedElements(): {
        'oscd-dialog': typeof OscdDialog;
        'oscd-filled-button': typeof OscdFilledButton;
        'oscd-filled-text-field': typeof OscdFilledTextField;
        'oscd-scl-text-field': typeof OscdSclTextField;
        'oscd-icon': typeof OscdIcon;
        'oscd-icon-button': typeof OscdIconButton;
        'oscd-divider': typeof OscdDivider;
        'oscd-list': typeof OscdList;
        'oscd-list-item': typeof OscdListItem;
        'confirm-dialog': typeof ConfirmDialog;
    };
    subfunctions: SubfunctionData[];
    dialog: OscdDialog;
    nameField: OscdFilledTextField;
    descriptionField: OscdSclTextField;
    typeField: OscdSclTextField;
    confirmDialog: ConfirmDialog;
    name: string;
    description: string | null;
    type: string | null;
    step: CreateSubfunctionDialogStep;
    confirmAction: 'cancel' | null;
    private formGroup;
    private readonly boundHandleDocumentKeydown;
    show(): void;
    close(): void;
    private closeWithoutConfirm;
    reset(): void;
    private handleClosed;
    private handleCancel;
    private handleDocumentKeydown;
    private readonly nameNotTakenValidator;
    private handleNext;
    private handleBack;
    private handleSave;
    private handleConfirm;
    renderSubfunctionAttrs(): import("lit-html").TemplateResult<1>;
    renderSubfunctionContent(): import("lit-html").TemplateResult<1>;
    render(): import("lit-html").TemplateResult<1>;
    static readonly styles: import("lit").CSSResult;
}
export {};
