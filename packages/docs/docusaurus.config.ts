import { themes as prismThemes } from 'prism-react-renderer';

import type * as Preset from '@docusaurus/preset-classic';
import type { Config } from '@docusaurus/types';

const config: Config = {
    title: 'PixiJS AssetPack',
    tagline: 'A configurable asset pipeline for the web',
    favicon: 'img/favicon.png',

    // Set the production url of your site here
    url: 'https://pixijs.io',
    baseUrl: '/assetpack/',

    // GitHub pages deployment config.
    // If you aren't using GitHub pages, you don't need these.
    organizationName: 'pixijs', // Usually your GitHub org/user name.
    projectName: 'assetpack', // Usually your repo name.
    deploymentBranch: 'gh-pages', // Branch that GitHub pages will deploy to.
    trailingSlash: true,

    onBrokenLinks: 'throw',
    onBrokenMarkdownLinks: 'warn',

    // Even if you don't use internationalization, you can use this field to set
    // useful metadata like html lang. For example, if your site is Chinese, you
    // may want to replace "en" with "zh-Hans".
    i18n: {
        defaultLocale: 'en',
        locales: ['en'],
    },

    presets: [
        [
            'classic',
            {
                docs: {
                    sidebarPath: './sidebars.ts',
                    // Please change this to your repo.
                    // Remove this to remove the "edit this page" links.
                    editUrl: 'https://github.com/pixijs/assetpack/tree/main/packages/docs/',
                },
                blog: {
                    showReadingTime: true,
                    // Please change this to your repo.
                    // Remove this to remove the "edit this page" links.
                    editUrl: 'https://github.com/pixijs/assetpack/tree/main/packages/docs/',
                },
                theme: {
                    customCss: './src/css/custom.css',
                },
                gtag: {
                    trackingID: 'G-T29MZ70FF1',
                },
            } satisfies Preset.Options,
        ],
    ],

    themeConfig: {
        // Replace with your project's social card
        image: 'img/ogimage.jpg',
        colorMode: {
            defaultMode: 'dark',
            disableSwitch: true,
            respectPrefersColorScheme: false,
        },
        navbar: {
            title: 'AssetPack',
            logo: {
                alt: 'PixiJS Logo',
                src: 'img/logo.svg',
            },
            items: [
                {
                    type: 'docSidebar',
                    sidebarId: 'guide',
                    position: 'left',
                    label: 'Guide',
                },
                {
                    href: 'https://opencollective.com/pixijs',
                    className: 'header-link header-open-col-link',
                    'aria-label': 'Open Collective',
                    position: 'right',
                },
                {
                    href: 'https://twitter.com/pixijs',
                    position: 'right',
                    className: 'header-link header-twitter-link',
                    'aria-label': 'Twitter account',
                },
                {
                    href: 'https://discord.gg/CPTjeb28nH',
                    position: 'right',
                    className: 'header-link header-discord-link',
                    'aria-label': 'Discord server',
                },
                {
                    href: 'https://github.com/pixijs/assetpack',
                    position: 'right',
                    className: 'header-link header-github-link',
                    'aria-label': 'GitHub repository',
                },
            ],
        },
        prism: {
            theme: prismThemes.github,
            darkTheme: prismThemes.dracula,
        },
    } satisfies Preset.ThemeConfig,
};

export default config;
