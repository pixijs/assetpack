// pipe
// 1. texture packer
// 2. json compressed
// 3. image mipping
// 4. image compression
// 5. webfont
// 6. manifest
// get an asset...
// update the assets..
// remove all the children (recursively)
// process through the list..
// never repeat a process
// texture packer -> json compressed -> image mipping -> image compression.
export function extractTagsFromFileName(basename: string, metaData: Record<string, any> = {}) {
    const regex = /{([^}]+)}/g;
    const matches = basename
        .match(regex)
        ?.map((tag) => tag.replace(/\s+/g, ''))
        ?.map((tag) => tag.slice(1, -1));

    if (!matches || matches.length < 1) return metaData;

    for (let i = 0; i < matches.length; i++) {
        const tagsContent = matches[i];

        if (tagsContent.includes('=')) {
            const [tag, value] = tagsContent.split('=');

            const values = value.split('&').map((v) => {
                v = v.trim();

                const numberValue = Number(v);

                if (Number.isNaN(numberValue)) {
                    return v;
                }

                return numberValue;
            });

            metaData[tag] = values.length > 1 ? values : values[0];
            // value.split('&').forEach((v, index) =>
            // // try con convert to a number
        } else {
            metaData[tagsContent] = true;
        }
    }

    return metaData;
}
