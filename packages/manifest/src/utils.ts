export function getManifestName(path: string, entry: string): string | null
{
    // Get the string after the entry path
    const val = path.replace(entry, '');
    // Get the string after the last /{m}/
    const res = val.split('/').filter((v: string) => v.match(/{m}/) !== null).at(-1) as string;

    if (!res) return null;

    // Split the string after the last /{m}/
    const split = val.split(res);
    // Remove the {m} from the string
    let targetPath = (split[0] + res).replace(/{(.*?)}/g, '');

    // Remove the leading and trailing /
    if (targetPath.startsWith('/')) targetPath = targetPath.slice(1);
    if (targetPath.endsWith('/')) targetPath = targetPath.slice(0, -1);

    return targetPath;
}
