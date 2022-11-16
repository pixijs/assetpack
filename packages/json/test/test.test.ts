import { assetPath, createFolder, getInputDir, getOutputDir } from '../../../shared/test';

const pkg = 'json';

describe('Json', () =>
{
    it('should fail gracefully if json is malformed', async () =>
    {
        const testName = 'json-busted';
        const inputDir = getInputDir(pkg, testName);
        const outputDir = getOutputDir(pkg, testName);

        createFolder(
            pkg,
            {
                name: testName,
                files: [
                    {
                        name: 'busted.json',
                        content: assetPath(pkg, 'json-busted.json'),
                    },
                ],
                folders: [],
            }
        );

        expect(inputDir.includes('packages/json/.testInput/json-busted'));
        expect(outputDir.includes('packages/json/.testOutput/json-busted'));
        // const bulldog = new Bulldog({
        //     entry: inputDir,
        //     output: outputDir,
        //     cache: false,
        // });

        // bulldog.add(new Json());

        // await bulldog.run();

        // // expect json file to be generated
        // expect(existsSync(`${outputDir}/busted.json`)).toBe(true);
    });

    // it('should not modify the json if ignored', async () =>
    // {
    //     const testName = 'json-ignore';
    //     const inputDir = getInputDir(testName);
    //     const outputDir = getOutputDir(testName);

    //     createFolder({
    //         name: testName,
    //         files: [],
    //         folders: [
    //             {
    //                 name: 'json',
    //                 files: [
    //                     {
    //                         name: 'json{no-json}.json',
    //                         content: assetPath('json/json.json'),
    //                     },
    //                 ],
    //                 folders: [],
    //             },
    //         ],
    //     });
    //     const bulldog = new Bulldog({
    //         entry: inputDir,
    //         output: outputDir,
    //         cache: false,
    //     });

    //     bulldog.add(new Json());

    //     await bulldog.run();

    //     const data = readFileSync(`${outputDir}/json/json.json`, 'utf8');
    //     const res = data.split('\n').length;

    //     expect(res).toEqual(4);
    // });
});
