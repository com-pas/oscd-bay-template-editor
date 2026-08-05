import { LitElement } from 'lit';
import { OscdDialog } from '@omicronenergy/oscd-ui/dialog/OscdDialog.js';
import { OscdFilledButton } from '@omicronenergy/oscd-ui/button/OscdFilledButton.js';
import { OscdFilledTextField } from '@omicronenergy/oscd-ui/textfield/OscdFilledTextField.js';
import { OscdDivider } from '@omicronenergy/oscd-ui/divider/OscdDivider.js';
import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
import { OscdList } from '@omicronenergy/oscd-ui/list/OscdList.js';
import { OscdListItem } from '@omicronenergy/oscd-ui/list/OscdListItem.js';
import { OscdFilledSelect } from '@omicronenergy/oscd-ui/select/OscdFilledSelect.js';
import { OscdSelectOption } from '@omicronenergy/oscd-ui/select/OscdSelectOption.js';
import { type LinkService, type ObjectReferenceItem } from './object-references.js';
export interface CreateFunctionLinkEventDetail {
    service: LinkService;
    selectedReferences: ObjectReferenceItem[];
}
declare const FunctionLinkDialog_base: typeof LitElement & import("@open-wc/dedupe-mixin").Constructor<import("@open-wc/scoped-elements/types.js").ScopedElementsHost> & import("@open-wc/scoped-elements/types.js").ScopedElementsHostConstructor;
export declare class FunctionLinkDialog extends FunctionLinkDialog_base {
    static get scopedElements(): {
        'oscd-dialog': typeof OscdDialog;
        'oscd-filled-button': typeof OscdFilledButton;
        'oscd-filled-text-field': typeof OscdFilledTextField;
        'oscd-divider': typeof OscdDivider;
        'oscd-icon': typeof OscdIcon;
        'oscd-list': typeof OscdList;
        'oscd-list-item': typeof OscdListItem;
        'oscd-filled-select': typeof OscdFilledSelect;
        'oscd-select-option': typeof OscdSelectOption;
    };
    private readonly dialog;
    sourceFunctionName: string;
    sourceFunctionPath: string;
    private allGroups;
    private filterQuery;
    private selectedService;
    private selectedReferenceIds;
    get open(): boolean;
    show(): void;
    showForSourceFunction(sourceFunction: Element, sclRoot: Document | null): void;
    close(): void;
    private resetSelectionState;
    private get filteredGroups();
    private get selectedReferences();
    private get canConnect();
    private handleSearchInput;
    private handleServiceChange;
    private handleToggleReference;
    private handleConnect;
    private dispatchCloseEvent;
    private handleDialogClosed;
    private renderReferenceRow;
    private renderReferenceList;
    render(): import("lit-html").TemplateResult<1>;
    static styles: import("lit").CSSResult;
}
export {};
