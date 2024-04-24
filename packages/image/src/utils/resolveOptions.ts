/**
 * Determines and returns the options based on the given arguments.
 *
 * This function checks if `options` is a boolean. If it is, and `options` is `true`,
 * the function returns `defaultOptions`. If `options` is `false`, the function returns `false`.
 * If `options` is not a boolean, the function merges `options` with `defaultOptions`,
 * giving precedence to the properties in `options`.
 *
 * @template T The type of the options object.
 * @param {options} T | boolean | undefined The custom options provided by the user,
 * or a boolean flag indicating whether to use the default options (`true`) or no options (`false`),
 * or `undefined` to use the default options.
 * @param {defaultOptions} T The default options object.
 * @returns {T} The resolved options object. If `options` is `false`, returns `false`.
 * Otherwise, returns an object of type `T` that merges `defaultOptions` and `options`,
 * with properties in `options` taking precedence.
 */
export function resolveOptions<T>(options: T | boolean | undefined, defaultOptions: T)
{
    if (typeof options === 'boolean')
    {
        return options ? defaultOptions : false;
    }

    return {
        ...defaultOptions,
        ...(options || {})
    } as T;
}
