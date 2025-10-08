import fs from 'fs-extra';
import zlib from 'node:zlib';
import { BuildReporter, path, stripTags } from '../core/index.js';

import type { Asset, AssetPipe, PipeSystem, PluginOptions } from '../core/index.js';

export interface PixiBundle {
    name: string;
    assets: PixiManifestEntry[];
    relativeName?: string;
}

export interface PixiManifest {
    bundles: PixiBundle[];
}

export interface PixiManifestEntry {
    alias: string | string[];
    src: (string | { src: string; progressSize?: number })[];
    data?: {
        // tags: Tags;
        [x: string]: any;
    };
    progressSize?: number;
}

export interface PixiManifestOptions extends PluginOptions {
    /**
     * The output location for the manifest file.
     */
    output?: string;
    /**
     * if true, the alias will be created with the basename of the file.
     */
    createShortcuts?: boolean;
    /**
     * if true, the extensions will be removed from the alias names.
     */
    trimExtensions?: boolean;
    /**
     * if true, the metaData will be outputted in the data field of the manifest.
     */
    includeMetaData?: boolean;
    /**
     * if true, the file sizes of each asset will be included in the manifest.
     * The sizes are in kilobytes (KB) and represent the gzipped size of each asset.
     * @default true
     */
    includeFileSizes?: false | 'gzip' | 'raw';
    /**
     * The name style for asset bundles in the manifest file.
     * When set to relative, asset bundles will use their relative paths as names.
     */
    nameStyle?: 'short' | 'relative';
    /**
     * Options for sorting the `src` array of each manifest entry or custom sorting function.
     */
    srcSortOptions?:
        | {
              /** The order to sort the `src` array with. */
              order?: 'ascending' | 'descending';
              /** Options to pass to localeCompare. */
              collatorOptions?: Intl.CollatorOptions;
          }
        | ((assetsSrc: PixiManifestEntry['src']) => PixiManifestEntry['src']);
    /**
     * if true, the all tags will be outputted in the data.tags field of the manifest.
     * If false, only internal tags will be outputted to the data.tags field. All other tags will be outputted to the data field directly.
     * @example
     * ```json
     * {
     *   "bundles": [
     *     {
     *       "name": "default",
     *       "assets": [
     *         {
     *           "alias": ["test"],
     *           "src": ["test.png"],
     *           "data": {
     *             "tags": {
     *               "nc": true,
     *               "customTag": true // this tag will be outputted to the data field directly instead of the data.tags field
     *             }
     *           }
     *         }
     *       ]
     *     }
     *   ]
     * }
     * @default true
     */
    legacyMetaDataOutput?: boolean;
}

export type PixiManifestTags = 'manifest' | 'mIgnore';

export function pixiManifest(_options: PixiManifestOptions = {}): AssetPipe<PixiManifestOptions, PixiManifestTags> {
    return {
        name: 'pixi-manifest',
        defaultOptions: {
            output: 'manifest.json',
            createShortcuts: false,
            trimExtensions: false,
            includeMetaData: true,
            legacyMetaDataOutput: true,
            includeFileSizes: false,
            nameStyle: 'short',
            ..._options,
        },
        tags: {
            manifest: 'm',
            mIgnore: 'mIgnore',
        },
        async finish(asset: Asset, options, pipeSystem: PipeSystem) {
            const newFileName =
                path.dirname(options.output) === '.'
                    ? path.joinSafe(pipeSystem.outputPath, options.output)
                    : options.output;

            const defaultBundle: PixiBundle = {
                name: 'default',
                assets: [],
            };

            const manifest: PixiManifest = {
                bundles: [defaultBundle],
            };

            collectAssets(
                asset,
                options,
                pipeSystem.outputPath,
                pipeSystem.entryPath,
                manifest.bundles,
                defaultBundle,
                this.tags!,
                pipeSystem.internalMetaData,
            );
            filterUniqueNames(manifest, options);
            await fs.writeJSON(newFileName, manifest, { spaces: 2 });
        },
    };
}

function filterUniqueNames(manifest: PixiManifest, options: PixiManifestOptions) {
    const nameMap = new Map<PixiManifestEntry, string[]>();
    const isNameStyleShort = options.nameStyle !== 'relative';
    const bundleNames = new Set<string>();
    const duplicateBundleNames = new Set<string>();

    manifest.bundles.forEach((bundle) => {
        if (isNameStyleShort) {
            if (bundleNames.has(bundle.name)) {
                duplicateBundleNames.add(bundle.name);
                BuildReporter.warn(
                    `[AssetPack][manifest] Duplicate bundle name '${bundle.name}'. All bundles with that name will be renamed to their relative name instead.`,
                );
            } else {
                bundleNames.add(bundle.name);
            }
        }

        bundle.assets.forEach((asset) => nameMap.set(asset, asset.alias as string[]));
    });

    const arrays = Array.from(nameMap.values());
    const sets = arrays.map((arr) => new Set(arr));
    const uniqueArrays = arrays.map((arr, i) => arr.filter((x) => sets.every((set, j) => j === i || !set.has(x))));

    manifest.bundles.forEach((bundle) => {
        if (isNameStyleShort) {
            // Switch to relative bundle name to avoid duplications
            if (duplicateBundleNames.has(bundle.name)) {
                bundle.name = bundle.relativeName ?? bundle.name;
            }
        }

        bundle.assets.forEach((asset) => {
            const names = nameMap.get(asset) as string[];

            asset.alias = uniqueArrays.find((arr) => arr.every((x) => names.includes(x))) as string[];
        });
    });
}

function getRelativeBundleName(asset: Asset, entryPath: string): string {
    let name = asset.filename;
    let parent = asset.parent;

    // Exclude assets the paths of which equal to the entry path
    while (parent && parent.path !== entryPath) {
        name = `${parent.filename}/${name}`;
        parent = parent.parent;
    }

    return stripTags(name);
}

function collectAssets(
    asset: Asset,
    options: PixiManifestOptions,
    outputPath = '',
    entryPath = '',
    bundles: PixiBundle[],
    bundle: PixiBundle,
    tags: AssetPipe<null, 'manifest' | 'mIgnore'>['tags'],
    internalTags: Record<string, any>,
) {
    if (asset.skip) return;
    // an item may have been deleted, so we don't want to add it to the manifest!
    if (asset.state === 'deleted') return;

    let localBundle = bundle;

    if (asset.metaData[tags!.manifest!]) {
        localBundle = {
            name:
                options.nameStyle === 'relative' ? getRelativeBundleName(asset, entryPath) : stripTags(asset.filename),
            assets: [],
        };

        // This property helps rename duplicate bundle declarations
        // Also, mark it as non-enumerable to prevent fs from including it into output
        if (options.nameStyle !== 'relative') {
            Object.defineProperty(localBundle, 'relativeName', {
                enumerable: false,
                get() {
                    return getRelativeBundleName(asset, entryPath);
                },
            });
        }

        bundles.push(localBundle);
    }

    const bundleAssets = localBundle.assets;
    const finalAssets = asset.getFinalTransformedChildren();

    if (asset.transformChildren.length > 0) {
        const finalManifestAssets = finalAssets.filter((finalAsset) => !finalAsset.inheritedMetaData[tags!.mIgnore!]);

        if (finalManifestAssets.length === 0) return;

        const metadata = {
            tags: { ...asset.getInternalMetaData(internalTags) },
            ...asset.getPublicMetaData(internalTags),
        } as Record<string, any>;

        if (options.legacyMetaDataOutput) {
            metadata.tags = asset.allMetaData;
        }

        // Set up sorting options
        let sortFn: (assetsSrc: PixiManifestEntry['src']) => PixiManifestEntry['src'];

        if (typeof options.srcSortOptions === 'function') {
            sortFn = options.srcSortOptions;
        } else {
            const isAscending = options.srcSortOptions?.order === 'ascending';
            const collatorOptions = options.srcSortOptions?.collatorOptions;

            sortFn = (assetsSrc: PixiManifestEntry['src']) =>
                assetsSrc.sort((a, b) => {
                    const aSrc = typeof a === 'string' ? a : a.src;
                    const bSrc = typeof b === 'string' ? b : b.src;

                    return (isAscending ? aSrc : bSrc).localeCompare(
                        isAscending ? bSrc : aSrc,
                        undefined,
                        collatorOptions,
                    );
                });
        }

        const bundledAsset: PixiManifestEntry = {
            alias: getShortNames(stripTags(path.relative(entryPath, asset.path)), options),
            src: sortFn(
                finalManifestAssets.map((finalAsset) => {
                    const src = path.relative(outputPath, finalAsset.path);
                    let size: number;

                    if (!options.includeFileSizes) {
                        return src;
                    }

                    try {
                        if (options.includeFileSizes === 'raw') {
                            size = fs.statSync(finalAsset.path).size;
                        } else {
                            size = zlib.gzipSync(fs.readFileSync(finalAsset.path)).length;
                        }
                        size = Number((size / 1024).toFixed(2));
                    } catch (_e) {
                        BuildReporter.warn(
                            `[AssetPack][manifest] Unable to get size for asset '${finalAsset.path}'. Skipping file size entry.`,
                        );
                        size = 1;
                    }

                    return {
                        src,
                        progressSize: size,
                    };
                }),
            ),
            data: options.includeMetaData ? metadata : undefined,
        };

        bundleAssets.push(bundledAsset);
    }

    asset.children.forEach((child) => {
        collectAssets(child, options, outputPath, entryPath, bundles, localBundle, tags, internalTags);
    });

    // for all assets.. check for atlas and remove them from the bundle..
}

function getShortNames(name: string, options: PixiManifestOptions) {
    const createShortcuts = options.createShortcuts;
    const trimExtensions = options.trimExtensions;

    const allNames = [];

    allNames.push(name);

    trimExtensions && allNames.push(path.trimExt(name));
    createShortcuts && allNames.push(path.basename(name));
    createShortcuts && trimExtensions && allNames.push(path.trimExt(path.basename(name)));

    // remove duplicates
    const uniqueNames = new Set(allNames);

    allNames.length = 0;
    uniqueNames.forEach((name) => allNames.push(name));

    return allNames;
}
