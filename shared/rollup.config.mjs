import { builtinModules } from 'module';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

/**
 * Create a base rollup config
 * @param {Record<string,any>} pkg Imported package.json
 * @param {string[]} external Imported package.json
 * @returns {import('rollup').RollupOptions}
 */
export function createConfig({ pkg, external = [] })
{
    return [
        {
            input: 'src/index.ts',
            external: Object.keys(pkg.dependencies || {})
                .concat(Object.keys(pkg.peerDependencies || {}))
                .concat(builtinModules)
                .concat(external),
            onwarn: (warning) =>
            {
                throw Object.assign(new Error(), warning);
            },
            strictDeprecations: true,
            output: [
                {
                    format: 'cjs',
                    file: pkg.main,
                    exports: 'named',
                    sourcemap: true,
                },
                {
                    format: 'es',
                    file: pkg.module,
                    plugins: [emitModulePackageFile()],
                    sourcemap: true,
                },
            ],
            plugins: [typescript()],
        },
        {
            input: `src/index.ts`,
            plugins: [dts()],
            output: {
                file: `dist/types/index.d.ts`,
                format: 'es',
            },
        },
    ];
}

export function emitModulePackageFile()
{
    return {
        name: 'emit-module-package-file',
        generateBundle()
        {
            this.emitFile({
                type: 'asset',
                fileName: 'package.json',
                source: `{"type":"module"}`,
            });
        },
    };
}
