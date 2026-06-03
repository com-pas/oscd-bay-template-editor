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
import { type SubfunctionData } from '../../util.js';
import { CreateSubfunctionDialog } from '../create-subfunction-dialog/create-subfunction-dialog.js';
import { ConfirmDialog } from '../confirmation-dialog/confirmation-dialog.js';
export declare enum CreateFunctionDialogStep {
    FunctionAttributes = "function-attributes",
    FunctionContent = "function-content"
}
declare const CreateFunctionDialog_base: typeof LitElement & import("@open-wc/scoped-elements/lit-element.js").ScopedElementsHostConstructor;
export declare class CreateFunctionDialog extends CreateFunctionDialog_base {
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
        'add-subfunction-dialog': typeof CreateSubfunctionDialog;
        'confirm-dialog': typeof ConfirmDialog;
    };
    parent: Element | null;
    selectedElementName: string;
    selectedElementType: string;
    dialog: OscdDialog;
    nameField: OscdFilledTextField;
    descriptionField: OscdSclTextField;
    typeField: OscdSclTextField;
    createSubfunctionDialog: CreateSubfunctionDialog;
    confirmDialog: ConfirmDialog;
    name: string;
    description: string | null;
    type: string | null;
    step: CreateFunctionDialogStep;
    tempSubfunctions: SubfunctionData[];
    selectedSubfunction: number | null;
    private formGroup;
    private shouldEmitCancel;
    show(): void;
    close(): void;
    reset(): void;
    private handleClosed;
    private readonly nameTakenValidator;
    private handleNext;
    private handleSave;
    private handleAddSubfunction;
    private handleSaveSubfunction;
    private handleDeleteSubfunction;
    private handleSubfunctionClick;
    private handleConfirmDeleteSubfunction;
    renderFunctionAttrs(): import("lit-html").TemplateResult<1>;
    renderFunctionContent(): import("lit-html").TemplateResult<1>;
    render(): import("lit-html").TemplateResult<1>;
    static readonly styles: import("lit").CSSResult;
}
export {};
