/* eslint-disable import/no-extraneous-dependencies */
import { fixture, html } from '@open-wc/testing';
import { visualDiff } from '@web/test-runner-visual-regression';
import { FunctionsLayer } from './functions-layer.js';
import { docWithBayAndFunctions } from './functions-layer-testfiles.js';
window.customElements.define('functions-layer', FunctionsLayer);
describe('FunctionsLayer component', () => {
    let editor;
    function getFunctionPixelCoordinates(_editor, functionName) {
        const fn = _editor.functions.find(f => f.name === functionName);
        if (!fn)
            throw new Error(`Function ${functionName} not found`);
        const x = fn.x * _editor.gridSize;
        const y = fn.y * _editor.gridSize;
        return [x, y];
    }
    describe('with an SCL document with bays and functions', () => {
        beforeEach(async () => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(docWithBayAndFunctions, 'application/xml');
            const props = {
                doc,
                editCount: -1,
                gridSize: 24,
                nsp: 'eosld',
                placing: false,
                placingOffset: [0, 0],
                onStartPlaceFunction: () => { },
            };
            editor = await fixture(html `<functions-layer
          .doc=${props.doc}
          .editCount=${props.editCount}
          .gridSize=${props.gridSize}
          .nsp=${props.nsp}
          .placing=${props.placing}
          .placingOffset=${props.placingOffset}
          .onStartPlaceFunction=${props.onStartPlaceFunction}
        ></functions-layer>`);
            document.body.prepend(editor);
            await editor.updateComplete;
            await document.fonts.ready;
        });
        it('renders the functions layer correctly', async () => {
            await visualDiff(editor, `functions-layer/#1 Render functions.png`);
        });
        it.skip('renders the function coordinates tooltip correctly when placing a function', async () => {
            const [fx, fy] = getFunctionPixelCoordinates(editor, 'F1');
            editor.placing = {
                name: 'F1',
                parent: null,
                element: editor.functions[0].element,
                x: fx / editor.gridSize,
                y: fy / editor.gridSize,
            };
            await editor.updateComplete;
            const fnRect = editor.svg.querySelector('rect#F1');
            fnRect?.dispatchEvent(new MouseEvent('click', { clientX: fx, clientY: fy, bubbles: true }));
            fnRect?.dispatchEvent(new MouseEvent('mousemove', { clientX: fx, clientY: fy, bubbles: true }));
            await editor.updateComplete;
            await visualDiff(editor, `functions-layer/#2 Render function coordinates tooltip.png`);
        });
    });
});
//# sourceMappingURL=functions-layer.test.js.map