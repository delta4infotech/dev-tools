/** @type {import('next-sitemap').IConfig} */
const siteUrl = process.env.SITE_URL || "https://delta4.io";

module.exports = {
  siteUrl: `${siteUrl}/tools`,
  generateRobotsTxt: false,
  generateIndexSitemap: false,
  changefreq: "monthly",
  priority: 0.7,
  outDir: "public",
};
