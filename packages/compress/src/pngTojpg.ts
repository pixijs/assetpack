// TODO: create a plugin that converts png files to jpg if they don't have an alpha channel
// import sharp from 'sharp';

// async function hasAlpha(input: string)
// {
//     let res: number[];

//     try
//     {
//         res = await sharp(input)
//             .ensureAlpha()
//             .extractChannel(3)
//             .toColourspace('b-w')
//             .raw({ depth: 'ushort' })
//             .toBuffer() as unknown as number[];
//     }
//     catch (error)
//     {
//         res = [];
//     }

//     const hasAlpha = (res).some((v) => v !== 255);

//     return hasAlpha;
// }
