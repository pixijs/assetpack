// TODO EXPORT this out! But don't want to create a dependency on the atlas plugin just yet..
export class AtlasView
{
    public rawAtlas: string;

    constructor(buffer: Buffer)
    {
        this.rawAtlas = buffer.toString();
    }

    getTextures(): string[]
    {
        const regex = /^.+?(?:\.png|\.jpg|\.jpeg|\.webp|\.avif)$/gm;

        const matches = this.rawAtlas.match(regex);

        return matches as string[];
    }

    replaceTexture(filename: string, newFilename: string)
    {
        this.rawAtlas = this.rawAtlas.replace(filename, newFilename);
    }

    get buffer()
    {
        return Buffer.from(this.rawAtlas);
    }
}
