import fs from 'fs-extra';
import otf2svg from 'otf2svg';
import svg2ttf from 'svg2ttf';
import { convertTTFToWOFF2 } from '@napi-rs/woff-build';

export const fonts = {
    ttf: {
        to: {
            woff2: (inFile: string | Buffer): Buffer => {
                if (Buffer.isBuffer(inFile)) {
                    return convertTTFToWOFF2(inFile);
                }

                return convertTTFToWOFF2(fs.readFileSync(inFile));
            },
        },
    },
    svg: {
        to: {
            ttf: (inFile: string) => {
                if (inFile.startsWith('<')) {
                    return Buffer.from(svg2ttf(inFile).buffer);
                }

                return Buffer.from(svg2ttf(fs.readFileSync(inFile, 'utf8'), {}).buffer);
            },
            woff2: (inFile: string) => {
                // Convert SVG to TTF
                const res = fonts.svg.to.ttf(inFile);

                // Convert TTF to WOFF/WOFF2
                return fonts.ttf.to.woff2(res);
            },
        },
    },
    otf: {
        to: {
            svg: (inFile: string) => {
                const res = otf2svg.convert(inFile);

                return res;
            },
            ttf: (inFile: string) => {
                // Convert to SVG, the only format possible for otf
                const res = fonts.otf.to.svg(inFile);

                // Convert SVG to TTF
                return fonts.svg.to.ttf(res);
            },
            woff2: (inFile: string) => {
                // Convert to SVG, the only format possible for otf
                let res: string | Buffer = fonts.otf.to.svg(inFile);

                // Convert SVG to TTF
                res = fonts.svg.to.ttf(res as string);

                // Convert TTF to WOFF/WOFF2
                return fonts.ttf.to.woff2(res as Buffer);
            },
        },
    },
};
