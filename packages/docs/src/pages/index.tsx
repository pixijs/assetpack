import clsx from 'clsx';
import styles from './index.module.css';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Heading from '@theme/Heading';
import Layout from '@theme/Layout';

function HomepageHeader()
{
    const { siteConfig } = useDocusaurusContext();

    return (
        <header className={clsx(styles.heroBanner)}>
            <div className="container">
                <Heading as="h1">
                    <img src="/assetpack/img/logo-main.svg" alt="Logo" width={'50%'} />
                </Heading>
                <p className="hero__subtitle" style={{ marginTop: -30 }}>
                    {siteConfig.tagline}
                </p>
                <div className={styles.buttons} style={{ paddingTop: 0 }}>
                    <Link className="button button--primary button--lg" style={{ color: 'white' }} to="/docs/guide/getting-started/installation">
            Get Started
                    </Link>
                    <Link className="button button--primary button--lg" style={{ color: 'white' }} to="/docs/guide/pipes/overview">
            Features
                    </Link>
                </div>
            </div>
        </header>
    );
}

export default function Home()
{
    const { siteConfig } = useDocusaurusContext();

    return (
        <Layout title={`${siteConfig.title}`} description="PixiJS AssetPack">
            <HomepageHeader />
            <main
                style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', marginLeft: 50 }}
            >
                <img
                    src="/assetpack/img/assetpack-screenshot.png"
                    alt="Hero"
                />
            </main>
        </Layout>
    );
}
