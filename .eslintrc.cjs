module.exports = {
    extends: ["@pixi/eslint-config"],
    parserOptions: {
        project: "./tsconfig.eslint.json",
        ecmaVersion: 2020,
        sourceType: "module",
    },
    plugins: ['import'],
    rules: {
        "spaced-comment": [1, "always", { markers: ["/"] }],
        "@typescript-eslint/triple-slash-reference": [1, { path: "always" }],
        "@typescript-eslint/type-annotation-spacing": 1,
        "@typescript-eslint/no-non-null-assertion": 0,
        "@typescript-eslint/consistent-type-imports":
          ["error", { disallowTypeAnnotations: false }],
        "import/consistent-type-specifier-style": ["error", "prefer-top-level"],
        "import/no-duplicates": ["error"],
        "camelcase": 0,
        "max-len": ["error", { code: 180 }],
    },
    overrides: [
        {
            files: ["*.tests.ts", "*.test.ts"],
            rules: {
                "@typescript-eslint/no-unused-expressions": 0,
                "@typescript-eslint/dot-notation": [
                    0,
                    {
                        allowPrivateClassPropertyAccess: true,
                        allowProtectedClassPropertyAccess: true,
                        allowIndexSignaturePropertyAccess: true,
                    },
                ],
                "dot-notation": 0,
            },
        },
    ],
};
