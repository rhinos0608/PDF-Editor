declare module 'react-color' {
  export interface RGBColor {
    r: number;
    g: number;
    b: number;
    a?: number;
  }

  export interface HSLColor {
    h: number;
    s: number;
    l: number;
    a?: number;
  }

  export interface ColorResult {
    hex: string;
    rgb: RGBColor;
    hsl: HSLColor;
  }

  export interface ColorPickerProps {
    color?: string | RGBColor | HSLColor;
    onChange?: (color: ColorResult) => void;
    onChangeComplete?: (color: ColorResult) => void;
  }

  export const ChromePicker: React.FC<ColorPickerProps>;
  export const SketchPicker: React.FC<ColorPickerProps>;
  export const PhotoshopPicker: React.FC<ColorPickerProps>;
  export const BlockPicker: React.FC<ColorPickerProps>;
  export const GithubPicker: React.FC<ColorPickerProps>;
  export const TwitterPicker: React.FC<ColorPickerProps>;
  export const HuePicker: React.FC<ColorPickerProps>;
  export const AlphaPicker: React.FC<ColorPickerProps>;
  export const CirclePicker: React.FC<ColorPickerProps>;
  export const SliderPicker: React.FC<ColorPickerProps>;
  export const CompactPicker: React.FC<ColorPickerProps>;
  export const MaterialPicker: React.FC<ColorPickerProps>;
  export const SwatchesPicker: React.FC<ColorPickerProps>;
}
