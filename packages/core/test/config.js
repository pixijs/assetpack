import plugin from '@start/plugin';

module.exports = {
    entry: '',
    output: '',
    plugins: {
        json: plugin()
    },
    files: [
        {
            files: ['**/*.json'],
            tags: [],
            settings: {
                json: {
                    tags: {
                        json: 'whatever'
                    },
                    something: 'else'
                }
            }
        }
    ]
};
