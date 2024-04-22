// TODO EXPORT this out!
export class AtlasView
{
    public rawAtlas: string;

    constructor(buffer: Buffer)
    {
        this.rawAtlas = buffer.toString();
    }

    getTextures(): string[]
    {
        const regex = /^.+?(?:\.png|\.jpg|\.jpeg)$/gm;

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
