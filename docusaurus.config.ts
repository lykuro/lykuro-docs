import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";
import type * as OpenApiPlugin from "docusaurus-plugin-openapi-docs";

const config: Config = {
  title: "Lykuro AI ドキュメント",
  tagline: "DeepSeek、Qwenを円建て・OpenAI互換APIで利用する",
  favicon: "img/favicon.ico",


  future: { v4: true },

  url: "https://docs.lykuro.ai",
  baseUrl: "/",

  organizationName: "lykuro",
  projectName: "lykuro-docs",

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  onBrokenAnchors: "ignore",

  i18n: {
    defaultLocale: "ja",
    locales: ["ja"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          editUrl: "https://github.com/lykuro/lykuro-docs/tree/main/",
          docItemComponent: "@theme/ApiItem",
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      "docusaurus-plugin-openapi-docs",
      {
        id: "api",
        docsPluginId: "classic",
        config: {
          lykuro: {
            specPath: "./openapi.yaml",
            outputDir: "docs/api-reference",
          } satisfies OpenApiPlugin.Options,
        },
      },
    ],
  ],

  themes: ["docusaurus-theme-openapi-docs"],

  themeConfig: {
    colorMode: {
      defaultMode: "dark",
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: "Lykuro AI",
      logo: {
        alt: "Lykuro AI",
        src: "img/logo.svg",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "docsSidebar",
          position: "left",
          label: "ドキュメント",
        },
        {
          to: "/docs/api-reference/overview",
          position: "left",
          label: "API リファレンス",
        },
        {
          href: "https://app.lykuro.ai",
          label: "ダッシュボード",
          position: "right",
        },
        {
          href: "https://github.com/lykuro/lykuro-docs",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "ドキュメント",
          items: [
            { label: "クイックスタート", to: "/docs/quickstart" },
            { label: "API リファレンス", to: "/docs/api-reference/overview" },
            { label: "価格表", to: "/docs/reference/pricing" },
          ],
        },
        {
          title: "統合ガイド",
          items: [
            { label: "OpenAI SDK", to: "/docs/guides/openai-sdk" },
            { label: "LangChain", to: "/docs/guides/langchain" },
            { label: "LiteLLM", to: "/docs/guides/litellm" },
          ],
        },
        {
          title: "サポート",
          items: [
            { label: "ダッシュボード", href: "https://app.lykuro.ai" },
            {
              label: "お問い合わせ",
              href: "mailto:support@lykuro.ai",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Lykuro AI. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ["python", "bash", "json", "typescript", "go"],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
