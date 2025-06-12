import type { CompressTags } from '../../image/compress.js';
import type { MipmapTags } from '../../image/mipmap.js';
import type { JsonTags } from '../../json/index.js';
import type { PixiManifestTags } from '../../manifest/pixiManifest.js';
import type { SpineAtlasCompressTags } from '../../spine/spineAtlasCompress.js';
import type { SpineAtlasMipmapTags } from '../../spine/spineAtlasMipmap.js';
import type { TexturePackerTags } from '../../texture-packer/texturePacker.js';
import type { TexturePackerCacheBusterTags } from '../../texture-packer/texturePackerCacheBuster.js';
import type { TexturePackerCompressTags } from '../../texture-packer/texturePackerCompress.js';
import type { SignedFontTags } from '../../webfont/sdf.js';
import type { WebfontTags } from '../../webfont/webfont.js';
import type { Asset } from '../Asset.js';
import type { PipeSystem } from './PipeSystem.js';

export type NotNull<T> = T extends null | undefined ? never : T;

// eslint-disable-next-line @typescript-eslint/ban-types
type Primitive = undefined | null | boolean | string | number | Function;

export type DeepRequired<T> = T extends Primitive
    ? NotNull<T>
    : {
        [P in keyof T]-?: T[P] extends Array<infer U>
            ? Array<DeepRequired<U>>
            : T[P] extends ReadonlyArray<infer U2>
                ? DeepRequired<U2>
                : DeepRequired<T[P]>
    };
export interface PluginOptions {}

export type Tags =
    | CompressTags
    | MipmapTags
    | JsonTags
    | PixiManifestTags
    | SpineAtlasCompressTags
    | SpineAtlasMipmapTags
    | TexturePackerTags
    | TexturePackerCacheBusterTags
    | TexturePackerCompressTags
    | WebfontTags
    | SignedFontTags
    | string & NonNullable<unknown>;

export interface AssetPipe<OPTIONS=Record<string, any>, TAGS extends Tags = string, INTERNAL_TAGS extends Tags = string>
{
    /** Whether the process runs on a folder */
    folder?: boolean;

    /** Name of the plugin used to tell the manifest parsers which one to use */
    name: string;

    /** Default options for the plugin */
    defaultOptions: OPTIONS;

    /** Tags that can be used to control the plugin */
    tags?: Record<TAGS, string>;

    /**
     * Any tags here will not be placed in the manifest data.
     */
    internalTags?: Record<INTERNAL_TAGS, string>;

    /**
     * Called once at the start.
     * @param asser - the root asset
     * @param processor - Processor that called the function.
     */
    start?(asset: Asset, options: DeepRequired<OPTIONS>, pipeSystem: PipeSystem): Promise<void>

    /**
     * Returns a boolean on whether or not the process should affect this tree.
     * @param asset - Tree to be tested.
     * @returns By defaults returns false.
     */
    test?(asset: Asset, options: DeepRequired<OPTIONS>): boolean;

    /**
     *
     * @param tree -
     * @param processor - Processor that called the function.
     */
    transform?(asset: Asset, options: DeepRequired<OPTIONS>, pipeSystem: PipeSystem): Promise<Asset[]>

    /**
     * Called once after tree has been processed.
     * @param asset - the root asset
     * @param processor - Processor that called the function.
     */
    finish?(asset: Asset, options: DeepRequired<OPTIONS>, pipeSystem: PipeSystem): Promise<void>
}

