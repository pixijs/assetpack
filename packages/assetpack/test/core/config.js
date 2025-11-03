import plugin from '@start/plugin';

module.exports = {
    entry: '',
    output: '',
    plugins: {
        json: plugin(),
    },
    files: [
        {
            files: ['**/*.json'],
            tags: [
                'hi',
                {
                    name: 'hi',
                    data: [100, 200],
                },
                {
                    name: 'hi',
                    data: {
                        a: 100,
                        b: 200,
                    },
                },
            ],
            settings: {
                json: {
                    tags: {
                        json: 'whatever',
                    },
                    something: 'else',
                },
            },
        },
    ],
};
