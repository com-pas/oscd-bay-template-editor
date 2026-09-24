import { LitElement } from 'lit';
import { OscdDialog } from '@omicronenergy/oscd-ui/dialog/OscdDialog.js';
import { OscdFilledButton } from '@omicronenergy/oscd-ui/button/OscdFilledButton.js';
import { OscdFilledTextField } from '@omicronenergy/oscd-ui/textfield/OscdFilledTextField.js';
import { OscdSclTextField } from '@omicronenergy/oscd-ui/scl-textfield/OscdSclTextField.js';
import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
import { OscdIconButton } from '@omicronenergy/oscd-ui/iconbutton/OscdIconButton.js';
import { OscdDivider } from '@omicronenergy/oscd-ui/divider/OscdDivider.js';
import { type FunctionData, type SubFunctionData } from '../../util.js';
import { CreateSubfunctionDialog } from '../create-subfunction-dialog/create-subfunction-dialog.js';
import { ConfirmDialog } from '../confirmation-dialog/confirmation-dialog.js';
import { LNodePicker } from '../lnode-picker/lnode-picker.js';
import { EditList } from '../edit-list/edit-list.js';
/** Detail of the `save` event. `functionElement` is set when editing an existing Function. */
export type SaveFunctionDetail = FunctionData & {
    functionElement: Element | null;
};
export declare enum CreateFunctionDialogStep {
    FunctionAttributes = "function-attributes",
    FunctionContent = "function-content"
}
declare const CreateFunctionDialog_base: typeof LitElement & import("@open-wc/dedupe-mixin").Constructor<import("@open-wc/scoped-elements/types.js").ScopedElementsHost> & import("@open-wc/scoped-elements/types.js").ScopedElementsHostConstructor;
export declare class CreateFunctionDialog extends CreateFunctionDialog_base {
    static get scopedElements(): {
        'oscd-dialog': typeof OscdDialog;
        'oscd-filled-button': typeof OscdFilledButton;
        'oscd-filled-text-field': typeof OscdFilledTextField;
        'oscd-scl-text-field': typeof OscdSclTextField;
        'oscd-icon': typeof OscdIcon;
        'oscd-icon-button': typeof OscdIconButton;
        'oscd-divider': typeof OscdDivider;
        'create-subfunction-dialog': typeof CreateSubfunctionDialog;
        'confirm-dialog': typeof ConfirmDialog;
        'lnode-picker': typeof LNodePicker;
        'edit-list': typeof EditList;
    };
    parent: Element | null;
    functionElement: Element | null;
    selectedElementName: string;
    selectedElementType: string;
    lnodeLibrary: Document | Element | null;
    dialog: OscdDialog;
    nameField: OscdFilledTextField;
    descriptionField: OscdSclTextField;
    typeField: OscdSclTextField;
    createSubfunctionDialog: CreateSubfunctionDialog;
    confirmDialog: ConfirmDialog;
    lnodePicker: LNodePicker;
    name: string;
    description: string | null;
    type: string | null;
    step: CreateFunctionDialogStep;
    subFunctions: SubFunctionData[];
    lnPickerOpen: boolean;
    lnodes: Element[];
    private get isEdit();
    private get selectedLNodeTypeIds();
    private get isEqFunction();
    private get elementName();
    private get subFunctionName();
    private formGroup;
    private shouldEmitCancel;
    private readonly boundHandleDocumentKeydown;
    show(): void;
    /** Fills the form with the current state of the Function being edited. */
    private loadFunctionElement;
    close(): void;
    private handleCloseConfirmed;
    reset(): void;
    private handleClosed;
    private handleCancel;
    private handleDocumentKeydown;
    private readonly nameTakenValidator;
    private handleNext;
    private handleSave;
    private handleAddSubFunction;
    private handleEditSubFunction;
    private handleSaveSubFunction;
    private handleDeleteSubFunction;
    private addOrReplaceSubFunction;
    private removeSubFunction;
    private handleAddLNode;
    private handleRemoveLNode;
    private handleLNodePickerCancel;
    private handleLNodePickerConfirm;
    renderFunctionAttrs(): import("lit-html").TemplateResult<1>;
    renderLNodePicker(): import("lit-html").TemplateResult<1>;
    renderFunctionContent(): import("lit-html").TemplateResult<1>;
    private renderDialogContent;
    render(): import("lit-html").TemplateResult<1>;
    static readonly styles: import("lit").CSSResult;
}
export {};
