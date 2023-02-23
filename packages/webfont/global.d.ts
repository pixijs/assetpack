declare module 'otf2svg'
{
    export function convertToFile(input: string, out: string): void;
    export function convert(input: string, codePoints?: number[]): string;
}

declare module 'msdf-bmfont-xml'
{
    interface BitmapFontOptions
    {
        /**
         * Type of output font file. Defaults to `xml`.
         * - `xml` a BMFont standard .fnt file which is widely supported.
         * - `json` a JSON file compatible with [Hiero](https://github.com/libgdx/libgdx/wiki/Hiero).
         */
        outputType?: 'xml' | 'json';
        /**
         * Filename of both font file and font atlas. If omitted, font face name is used.
         * Required if font is provided as a Buffer.
         */
        filename?: string;
        /** The characters to include in the bitmap font. Defaults to all ASCII printable characters. */
        charset?: string | string[];
        /** The font size at which to generate the distance field. Defaults to `42`. */
        fontSize?: number;
        /**
         * The dimensions of an output texture sheet, normally power-of-2 for GPU usage.
         * Both dimensions default to `[512, 512]`.
         */
        textureSize?: [number, number];
        /** Pixels between each glyph in the texture. Defaults to `2`. */
        texturePadding?: number;
        /** Space between glyph textures and edge. Defaults to `0`. */
        border?: number;
        /**
         * What kind of distance field to generate. Defaults to `msdf`. Must be one of:
         * - `msdf` Multi-channel signed distance field.
         * - `sdf` Monochrome signed distance field.
         * - `psdf` Monochrome signed pseudo-distance field.
         */
        fieldType?: 'msdf' | 'sdf' | 'psdf';
        /**
         * The width of the range around the shape between the minimum and maximum representable signed distance in pixels,
         * defaults to `3`.
         */
        distanceRange?: number;
        /** Rounded digits of the output font metrics. For `xml` output, `roundDecimal: 0` recommended. */
        roundDecimal?: number;
        /** Output an SVG Vector file for debugging. Defaults to `false`. */
        vector?: boolean;
        /** Shrink atlas to the smallest possible square. Default: `false`. */
        'smart-size'?: boolean;
        /** Output atlas size shall be power of 2. Default: `false`. */
        pot?: boolean;
        /** Output atlas size shall be square. Default: `false`. */
        square?: boolean;
        /** Allow 90-degree rotation while packing. Default: `false`. */
        rot?: boolean;
        /** Use RTL (Arabic/Persian) characters fix. Default: `false`. */
        rtl?: boolean;
    }

    type CallbackType = (
        error: Error | null | undefined,
        textures: { filename: string, texture: Buffer }[],
        font: { filename: string, data: string }
    ) => void;

    export default function (input: string | Buffer, cb: CallbackType): string;
    export default function (input: string | Buffer, opts: BitmapFontOptions, cb: CallbackType): string;
}
