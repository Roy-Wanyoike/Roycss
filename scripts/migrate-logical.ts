import { readdir, readFile, writeFile } from "fs/promises";
import { join } from "path";

const MAP: Record<string, string> = {
  "margin-left": "margin-inline-start", "margin-right": "margin-inline-end",
  "margin-top": "margin-block-start", "margin-bottom": "margin-block-end",
  "padding-left": "padding-inline-start", "padding-right": "padding-inline-end",
  "padding-top": "padding-block-start", "padding-bottom": "padding-block-end",
  "border-left": "border-inline-start", "border-right": "border-inline-end",
  "border-top": "border-block-start", "border-bottom": "border-block-end",
  "border-left-width": "border-inline-start-width", "border-right-width": "border-inline-end-width",
  "border-left-color": "border-inline-start-color", "border-right-color": "border-inline-end-color",
  "border-left-style": "border-inline-start-style", "border-right-style": "border-inline-end-style",
  "left": "inset-inline-start", "right": "inset-inline-end",
  "top": "inset-block-start", "bottom": "inset-block-end",
  "width": "inline-size", "height": "block-size",
  "min-width": "min-inline-size", "min-height": "min-block-size",
  "max-width": "max-inline-size", "max-height": "max-block-size",
  "text-align: left": "text-align: start", "text-align: right": "text-align: end",
  "float: left": "float: inline-start", "float: right": "float: inline-end",
};

function migrate(css: string): string {
  let result = css;
  for (const [physical, logical] of Object.entries(MAP)) {
    if (physical.includes(":")) {
      result = result.replace(new RegExp(physical.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), logical);
    } else {
      result = result.replace(new RegExp(`\\b${physical}\\s*:`, "gi"), `${logical}:`);
    }
  }
  return result;
}

async function main() {
  const libDir = join(process.cwd(), "src", "lib");
  const files = (await readdir(libDir)).filter(f => f.startsWith("effects-batch-") && f.endsWith(".ts")).sort();
  let total = 0;
  for (const file of files) {
    const content = await readFile(join(libDir, file), "utf-8");
    const migrated = content.replace(/cssCode:\s*`([\s\S]*?)`/g, (m, css) => `cssCode: \`${migrate(css)}\``);
    if (migrated !== content) { await writeFile(join(libDir, file), migrated, "utf-8"); total++; }
  }
  console.log(`Done: ${total} files migrated to logical properties`);
}
main().catch(console.error);
