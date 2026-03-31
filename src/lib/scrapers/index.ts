import { scrapeHetzner } from "./hetzner";
import { scrapeOvh } from "./ovh";
import { scrapeLambda } from "./lambda";
import { scrapeVultr } from "./vultr";
import { scrapeRunPod } from "./runpod";
import { scrapeVast } from "./vast";
import { scrapeTensordock } from "./tensordock";
import { scrapeDatacrunch } from "./datacrunch";
import { scrapeFluidstack } from "./fluidstack";
import { scrapeGenesis } from "./genesis";
import { scrapeSalad } from "./salad";
import { ScraperResult } from "../types";

export interface ScrapeAllResult {
  results: ScraperResult[];
  total_duration_ms: number;
}

export async function scrapeAll(): Promise<ScrapeAllResult> {
  const start = Date.now();
  console.log("Starting scrape of all providers...\n");

  const scrapers = [
    { name: "Hetzner",       fn: scrapeHetzner    },
    { name: "OVHcloud",      fn: scrapeOvh        },
    { name: "Lambda Labs",   fn: scrapeLambda     },
    { name: "Vultr",         fn: scrapeVultr      },
    { name: "RunPod",        fn: scrapeRunPod     },
    { name: "Vast.ai",       fn: scrapeVast       },
    { name: "TensorDock",    fn: scrapeTensordock },
    { name: "DataCrunch",    fn: scrapeDatacrunch },
    { name: "FluidStack",    fn: scrapeFluidstack },
    { name: "Genesis Cloud", fn: scrapeGenesis    },
    { name: "Salad Cloud",   fn: scrapeSalad      },
  ];

  const results: ScraperResult[] = [];

  for (const scraper of scrapers) {
    console.log(`Scraping ${scraper.name}...`);
    try {
      const result = await scraper.fn();
      results.push(result);
      const icon = result.errors.length > 0 ? "⚠" : "✓";
      console.log(
        `  ${icon} Found: ${result.servers_found}, Updated: ${result.servers_updated}, ` +
        `Errors: ${result.errors.length}, Time: ${result.duration_ms}ms`
      );
      for (const err of result.errors.slice(0, 3)) {
        console.log(`    Error: ${err}`);
      }
    } catch (e) {
      console.log(`  ✗ ${scraper.name} threw: ${e}`);
      results.push({
        provider_id: scraper.name.toLowerCase().replace(/\s+/g, "-"),
        servers_found: 0, servers_updated: 0,
        errors: [String(e)], duration_ms: 0,
      });
    }
    console.log();
  }

  const total_duration_ms = Date.now() - start;
  const totalFound   = results.reduce((s, r) => s + r.servers_found, 0);
  const totalUpdated = results.reduce((s, r) => s + r.servers_updated, 0);
  const totalErrors  = results.reduce((s, r) => s + r.errors.length, 0);

  console.log("─".repeat(40));
  console.log(`Total found:   ${totalFound}`);
  console.log(`Total updated: ${totalUpdated}`);
  console.log(`Total errors:  ${totalErrors}`);
  console.log(`Total time:    ${total_duration_ms}ms`);

  return { results, total_duration_ms };
}
