const regex = /\{[^}]*\}/g;

export function stripTags(str: string)
{
    // Replace all occurrences of the pattern with an empty string
    return str.replace(regex, '');
}
