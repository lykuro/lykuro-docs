import type { ReactNode } from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import Heading from "@theme/Heading";

import styles from "./index.module.css";

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx("hero hero--primary", styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/quickstart"
          >
            クイックスタート — 5分で始める ⚡
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="DeepSeek、QwenをOpenAI互換APIで利用する — 円建て・Zero-Retention"
    >
      <HomepageHeader />
      <main>
        <section className="container margin-vert--xl">
          <div className="row">
            <div className="col col--4">
              <div className="card">
                <div className="card__header">
                  <h3>🚀 OpenAI 互換</h3>
                </div>
                <div className="card__body">
                  <code>base_url</code> を差し替えるだけ。既存コードをそのまま利用できます。
                </div>
              </div>
            </div>
            <div className="col col--4">
              <div className="card">
                <div className="card__header">
                  <h3>💴 円建て従量課金</h3>
                </div>
                <div className="card__body">
                  Claude Sonnet の約 1/48 の価格。月額固定なし、使った分だけ。
                </div>
              </div>
            </div>
            <div className="col col--4">
              <div className="card">
                <div className="card__header">
                  <h3>🔒 Zero-Retention</h3>
                </div>
                <div className="card__body">
                  プロンプト本文は一切保存しません。法務・セキュリティ要件に対応。
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
