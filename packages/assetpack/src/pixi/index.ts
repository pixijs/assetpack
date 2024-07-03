import { cacheBuster } from '../cache-buster/cacheBuster.js';
import { merge } from '../core/index.js';
import { audio } from '../ffmpeg/audio.js';
import { compress } from '../image/compress.js';
import { mipmap } from '../image/mipmap.js';
import { json } from '../json/index.js';
import { pixiManifest } from '../manifest/pixiManifest.js';
import { spineAtlasCacheBuster } from '../spine/spineAtlasCacheBuster.js';
import { spineAtlasCompress } from '../spine/spineAtlasCompress.js';
import { spineAtlasManifestMod } from '../spine/spineAtlasManifestMod.js';
import { spineAtlasMipmap } from '../spine/spineAtlasMipmap.js';
import { texturePacker } from '../texture-packer/texturePacker.js';
import { texturePackerCacheBuster } from '../texture-packer/texturePackerCacheBuster.js';
import { texturePackerCompress } from '../texture-packer/texturePackerCompress.js';
import { webfont } from '../webfont/webfont.js';

import type { AssetPipe } from '../core/index.js';
import type { FfmpegOptions } from '../ffmpeg/ffmpeg.js';
import type { CompressOptions } from '../image/compress.js';
import type { PixiManifestOptions } from '../manifest/pixiManifest.js';
import type { TexturePackerOptions } from '../texture-packer/texturePacker.js';

/**
 * Options for the AssetpackPlugin.
 */
export interface PixiAssetPack
{
    cacheBust?: boolean;
    resolutions?: Record<string, number>;
    compression?: CompressOptions | false;
    texturePacker?: TexturePackerOptions;
    audio?: Partial<FfmpegOptions>;
    manifest?: PixiManifestOptions;
}

const resolutions = { default: 1, low: 0.5 };

/** the default config parts used by the Pixi pipes */
const defaultConfig: PixiAssetPack = {
    cacheBust: true,
    resolutions,
    compression: {
        png: true,
        jpg: true,
        webp: true,
    },
    texturePacker: {
        texturePacker: {
            nameStyle: 'short',
        },
    },
    audio: {},
    manifest: { createShortcuts: true },
};

/**
 * Returns an array of plugins that can be used by AssetPack to process assets
 * for a PixiJS project.
 */
export function pixiPipes(config: PixiAssetPack)
{
    const apConfig: Required<PixiAssetPack> = merge.recursive(defaultConfig, config);

    // don't merge the resolutions, just overwrite them
    // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
    apConfig.resolutions ??= config?.resolutions!;

    const pipes = [
        webfont(),
        audio(apConfig.audio as FfmpegOptions),
        texturePacker({
            ...apConfig.texturePacker,
            resolutionOptions: {
                ...apConfig.texturePacker?.resolutionOptions,
                resolutions: {
                    ...apConfig.resolutions,
                    ...apConfig.texturePacker?.resolutionOptions?.resolutions,
                } as Record<string, number>,
            },
        }),
        mipmap({
            resolutions: apConfig.resolutions as Record<string, number>,
        }),
        spineAtlasMipmap({
            resolutions: apConfig.resolutions as Record<string, number>,
        }),
    ] as AssetPipe[];

    if (apConfig.compression !== false)
    {
        pipes.push(
            compress(apConfig.compression),
            spineAtlasCompress(apConfig.compression),
            texturePackerCompress(apConfig.compression),
        );
    }

    pipes.push(json());

    if (apConfig.cacheBust)
    {
        pipes.push(cacheBuster(), spineAtlasCacheBuster(), texturePackerCacheBuster());
    }

    const manifestOptions = {
        createShortcuts: true,
        ...apConfig.manifest,
    };

    pipes.push(
        pixiManifest(manifestOptions),
        spineAtlasManifestMod(manifestOptions),
    );

    return pipes;
}
