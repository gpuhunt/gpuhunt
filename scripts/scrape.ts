import { scrapeAll } from "../src/lib/scrapers";

async function main() {
  const { results, total_duration_ms } = await scrapeAll();

  const totalFound = results.reduce((sum, r) => sum + r.servers_found, 0);
  const totalUpdated = results.reduce((sum, r) => sum + r.servers_updated, 0);
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

  console.log("\n--- Summary ---");
  console.log(`Total servers found: ${totalFound}`);
  console.log(`Total servers updated: ${totalUpdated}`);
  console.log(`Total errors: ${totalErrors}`);
  console.log(`Total time: ${total_duration_ms}ms`);

  if (totalErrors > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Scrape failed:", err);
  process.exit(1);
});
