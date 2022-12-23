declare module 'otf2svg'
{
    export function convertToFile(input: string, out: string): void;
    export function convert(input: string, codePoints?: number[]): string;
}
