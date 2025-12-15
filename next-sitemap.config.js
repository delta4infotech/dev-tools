/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || "https://delta4.io",
  generateRobotsTxt: false,
  generateIndexSitemap: false,
  changefreq: "monthly",
  priority: 0.7,
  outDir: "public",
};
