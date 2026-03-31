import { scrapeHetzner } from "./hetzner";
import { scrapeOvh } from "./ovh";
import { scrapeLambda } from "./lambda";
import { scrapeVultr } from "./vultr";
import { scrapeRunPod } from "./runpod";
import { ScraperResult } from "../types";

export interface ScrapeAllResult {
  results: ScraperResult[];
  total_duration_ms: number;
}

export async function scrapeAll(): Promise<ScrapeAllResult> {
  const start = Date.now();
  console.log("Starting scrape of all providers...\n");

  const scrapers = [
    { name: "Hetzner", fn: scrapeHetzner },
    { name: "OVHcloud", fn: scrapeOvh },
    { name: "Lambda Labs", fn: scrapeLambda },
    { name: "Vultr", fn: scrapeVultr },
    { name: "RunPod", fn: scrapeRunPod },
  ];

  const results: ScraperResult[] = [];

  for (const scraper of scrapers) {
    console.log(`Scraping ${scraper.name}...`);
    const result = await scraper.fn();
    results.push(result);
    console.log(
      `  Found: ${result.servers_found}, Updated: ${result.servers_updated}, ` +
      `Errors: ${result.errors.length}, Time: ${result.duration_ms}ms`
    );
    if (result.errors.length > 0) {
      for (const err of result.errors) {
        console.log(`  Error: ${err}`);
      }
    }
    console.log();
  }

  const total_duration_ms = Date.now() - start;
  console.log(`Scrape complete in ${total_duration_ms}ms`);
  return { results, total_duration_ms };
}
