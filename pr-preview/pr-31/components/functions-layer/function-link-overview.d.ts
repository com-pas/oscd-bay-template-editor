import { LitElement, nothing } from 'lit';
import { OscdIcon } from '@omicronenergy/oscd-ui/icon/OscdIcon.js';
import { OscdFilledButton } from '@omicronenergy/oscd-ui/button/OscdFilledButton.js';
import { OscdIconButton } from '@omicronenergy/oscd-ui/iconbutton/OscdIconButton.js';
import { type FunctionLink } from './function-links.js';
declare const FunctionLinkOverview_base: typeof LitElement & import("@open-wc/dedupe-mixin").Constructor<import("@open-wc/scoped-elements/types.js").ScopedElementsHost> & import("@open-wc/scoped-elements/types.js").ScopedElementsHostConstructor;
export declare class FunctionLinkOverview extends FunctionLinkOverview_base {
    static get scopedElements(): {
        'oscd-icon': typeof OscdIcon;
        'oscd-filled-button': typeof OscdFilledButton;
        'oscd-icon-button': typeof OscdIconButton;
    };
    selectedLink?: FunctionLink;
    expandedDetails: boolean;
    pendingDelete: boolean;
    overviewTop?: number;
    pendingRemovedSourceRefKeys: string[];
    private infoSourceRef?;
    protected willUpdate(changedProperties: Map<string, unknown>): void;
    private openSourceRefInfo;
    private closeSourceRefInfo;
    private renderInfoPane;
    private hasPendingSourceRefDeletion;
    private getVisibleSourceRefs;
    private renderDeleteWarning;
    private renderSelectedLink;
    render(): typeof nothing | import("lit-html").TemplateResult<1>;
    static styles: import("lit").CSSResult;
}
export {};
