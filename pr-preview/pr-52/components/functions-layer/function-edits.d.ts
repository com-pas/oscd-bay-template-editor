import type { EditV2 } from '@openscd/oscd-api';
import { type FunctionData, type SubFunctionData } from '../../util.js';
export interface UpdateFunctionData extends FunctionData {
    /** The existing (Eq)Function whose new state the `FunctionData` describes. */
    functionElement: Element;
}
export interface UpdateFunctionEdits {
    edits: EditV2[];
    /** Types of the newly created LNodes, still to be imported into the document. */
    newLNodeTypes: Element[];
}
/**
 * Computes the insertion reference for a new `tag` child of `parent`, as if
 * the `excluded` children had already been removed. Read-only: the DOM is
 * never touched. `excluded` may contain nodes anywhere in the document; only
 * children of `parent` affect the result.
 *
 * `getReference` returns the first child whose tag is `tag` or comes after it
 * in the schema sequence. In a schema-ordered parent, every later sibling also
 * qualifies, so skipping forward past excluded nodes yields the same result
 * `getReference` would give on the pruned parent.
 */
export declare function getInsertReference(parent: Element, tag: string, excluded: Iterable<Element>): Element | null;
/** Creates a new (Eq)SubFunction element, including LNodes for its LNodeTypes. */
export declare function createSubFunctionElement(doc: XMLDocument, tag: string, subFunction: SubFunctionData): Element;
/**
 * Builds the edits that bring an existing (Eq)Function in line with the state
 * edited in the dialog, in this order:
 * 1. attribute changes on the Function
 * 2. removals: SourceRefs pointing at removed LNodes, then the LNodes and
 *    SubFunctions themselves
 * 3. inserts of new LNodes and SubFunctions, plus attribute changes on kept
 *    SubFunctions
 * 4. SourceRef path updates for renamed Functions and SubFunctions
 */
export declare function buildUpdateFunctionEdits(doc: XMLDocument, update: UpdateFunctionData): UpdateFunctionEdits;
