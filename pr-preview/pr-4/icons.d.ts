import { TemplateResult } from 'lit';
export declare const zigZagPath: TemplateResult<2>;
export declare const zigZag2WTransform = "matrix(0.8, 0, 0, 0.8, 0.3, 0.3) translate(0 -0.1) rotate(-20 1.5 1.5)";
export declare function ptrIcon(windings: 1 | 2 | 3, { slot, kind, }?: {
    slot?: string;
    kind?: 'default' | 'auto' | 'earthing';
}): TemplateResult<1>;
export declare const voltageLevelIcon: TemplateResult<1>;
export declare const voltageLevelGraphic: TemplateResult<1>;
export declare const bayIcon: TemplateResult<1>;
export declare const bayGraphic: TemplateResult<1>;
export declare const functionsIcon: TemplateResult<1>;
export declare const functionsOffIcon: TemplateResult<1>;
export declare const eqRingPath: TemplateResult<2>;
export declare function equipmentPath(equipmentType: string | null): TemplateResult<2>;
export declare function equipmentGraphic(equipmentType: string | null): TemplateResult<1>;
export declare function equipmentIcon(equipmentType: string): TemplateResult<1>;
export declare const symbols: TemplateResult<2>;
