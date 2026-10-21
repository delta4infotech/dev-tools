import { PHP2SHELL_RULES } from "@/lib/php2shell/config";
import type { FAQProps } from "../../(components)/FAQ";

/** Shown on the page and published as FAQPage structured data. */
export const faqs: FAQProps[] = [
    {
        id: "1",
        title: "Does this tool attack or test my site for the vulnerability?",
        content:
            "No. It does only what a visitor's browser does: it loads the page you enter (and, for WordPress sites, the public /wp-json/ page) and reads the response headers and HTML. It never sends exploit code or anything that tests the vulnerability itself. Every request has a time limit, and private or internal addresses are refused.",
    },
    {
        id: "2",
        title: "Why can't it see my PHP version?",
        content:
            "Many hosts hide the PHP version, which is good practice. But when it's hidden, nobody outside can tell whether you're patched, so the tool says \"Can't confirm\" and shows where to find the version yourself. It never guesses \"safe\".",
    },
    {
        id: "3",
        title: "My version looks old, but my host says it's patched. Who's right?",
        content:
            "Possibly your host. Linux distributions such as Ubuntu, Debian and Red Hat often backport security fixes into older PHP packages without changing the version number. Ask your host to confirm in writing that your PHP build includes the fix for " +
            PHP2SHELL_RULES.cves.join(" and ") +
            ".",
    },
    {
        id: "4",
        title: "My site is behind Cloudflare. Am I protected?",
        content:
            "Only partly. Cloudflare can filter some attacks, but if your server's real IP address can be reached directly, attackers can skip Cloudflare entirely. Ask your host to accept web traffic only from Cloudflare, and update PHP either way.",
    },
    {
        id: "5",
        title: "What does \"Likely safe\" mean?",
        content:
            "Your site advertises a PHP version that includes the fix. Headers can be out of date or come from a different server (like a cache) than the one running your site, so confirm the version with your host or in your site's admin panel.",
    },
    {
        id: "6",
        title: "Why are online stores marked as higher risk?",
        content:
            "Stores built on WooCommerce, Magento, PrestaShop or OpenCart handle customer accounts, addresses and checkout. A break-in there costs more and is a bigger target, so it's worth fixing first.",
    },
    {
        id: "7",
        title: "Does updating WordPress or my plugins fix PHP2Shell?",
        content:
            "No. PHP2Shell is in PHP itself, so only a newer PHP version (or a patched PHP package from your host) fixes it. Keeping WordPress, plugins and themes updated is still worth doing for other reasons.",
    },
    {
        id: "8",
        title: "Do you save the sites I check?",
        content:
            "No. The address you enter is used for that one check, and neither it nor the result is saved. The check itself reads only what any visitor's browser could see.",
    },
    {
        id: "9",
        title: "How often should I run this check?",
        content:
            "After any PHP update, and whenever a new PHP security release comes out. If your host updates PHP for you, a quick check confirms it has been done.",
    },
    {
        id: "10",
        title: "My site's front end isn't PHP, but the back end is. Is it covered?",
        content:
            "Only the address you enter is checked. If your public site is built with something like Next.js or Nuxt and gets its content from Drupal, WordPress or another PHP back end at a different address, enter that back-end address too, or check its PHP version directly.",
    },
];
