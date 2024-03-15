import { AssetPack } from '../src/AssetPack';
// import { pixiTexturePacker } from '@assetpack/plugin-texture-packer';
import { compressPng } from '@assetpack/plugin-compress';

const assetPack = new AssetPack({
    entry: './buruburu-in',
    output: './buruburu-out',
    cache: false,
    pipes: [
        // pixiTexturePacker({
        //     resolutionOptions: {
        //         resolutions: { default: 1 },
        //     },
        // }),
        compressPng(),
    ],
});

assetPack.run();
