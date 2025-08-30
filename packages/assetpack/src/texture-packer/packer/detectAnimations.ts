import { path } from '../../core/index.js';

export function detectAnimations(frames: { [key: string]: any }): { [key: string]: string[] } {
    const frameNames = Object.keys(frames).sort();

    const suffixRegex = /[-_](\d+)$/;

    const frameGroups = frameNames.reduce<Record<string, string[]>>((acc, item) => {
        const key = path.trimExt(item).replace(suffixRegex, '');

        if (!acc[key]) {
            acc[key] = [];
        }

        acc[key].push(item);

        return acc;
    }, {});

    const animations: Record<string, string[]> = {};

    for (const key in frameGroups) {
        if (frameGroups[key].length > 1) {
            animations[key] = frameGroups[key].sort((a, b) => {
                a = path.trimExt(a);
                b = path.trimExt(b);
                const numA = parseInt(a.match(suffixRegex)![1], 10);
                const numB = parseInt(b.match(suffixRegex)![1], 10);

                return numA - numB;
            });
        }
    }

    return animations;
}
