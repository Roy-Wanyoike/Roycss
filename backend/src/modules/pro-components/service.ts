/**
 * Pro Components service — in-memory RoyCSS Pro component catalog.
 *
 * Stores 16 mock pro components (DataGrid, Kanban, Scheduler, Charts,
 * Calendar, Timeline, TreeView, OrgChart, RichTextEditor, PivotTable,
 * and more) across 5 categories. All reads are LRU-cached.
 *
 * Read-only — no mutation endpoints. The pro component catalog is a
 * curated platform asset.
 *
 * Future: source component metadata from the @roycss/pro package build.
 */
import { CACHE_TTL } from "../../config/constants.js";
import { cacheWrap } from "../../lib/cache.js";
import { createLogger } from "../../lib/logger.js";
import type { ProComponent } from "../../types/index.js";
import { AppError } from "../../server/middleware/error.js";

const log = createLogger("pro-components");

const LIST_KEY = "pro:components";
const detailKey = (id: string): string => `pro:component:${id}`;
const codeKey = (id: string): string => `pro:component:${id}:code`;
const CATEGORIES_KEY = "pro:categories";

type PropDef = { name: string; type: string; required: boolean; description: string };

function comp(
  id: string,
  name: string,
  category: string,
  description: string,
  props: PropDef[],
  codeSnippet: string,
): ProComponent {
  return { id, name, category, description, props, codeSnippet };
}

// ─── Seed: 16 pro components ─────────────────────────────────────────────
const SEED_COMPONENTS: ProComponent[] = [
  comp("pro-datagrid", "DataGrid", "data",
    "High-performance virtualized table with sorting, filtering, grouping, and inline editing.",
    [
      { name: "data", type: "T[]", required: true, description: "Row data array." },
      { name: "columns", type: "Column[]", required: true, description: "Column definitions." },
      { name: "pageSize", type: "number", required: false, description: "Rows per page (default 50)." },
      { name: "virtualized", type: "boolean", required: false, description: "Enable row virtualization." },
    ],
    `<DataGrid data={rows} columns={cols} pageSize={50} virtualized />`),
  comp("pro-kanban", "Kanban", "data",
    "Drag-and-drop board with swimlanes, WIP limits, and card animations.",
    [
      { name: "columns", type: "KanbanColumn[]", required: true, description: "Board columns." },
      { name: "cards", type: "KanbanCard[]", required: true, description: "Cards to render." },
      { name: "onMove", type: "(cardId, fromCol, toCol) => void", required: false, description: "Move handler." },
    ],
    `<Kanban columns={cols} cards={cards} onMove={handleMove} />`),
  comp("pro-scheduler", "Scheduler", "data",
    "Calendar scheduler with day/week/month views, drag-to-reschedule, and resource lanes.",
    [
      { name: "events", type: "CalendarEvent[]", required: true, description: "Events to render." },
      { name: "view", type: "'day' | 'week' | 'month'", required: false, description: "Initial view." },
      { name: "resources", type: "Resource[]", required: false, description: "Resource lanes." },
    ],
    `<Scheduler events={events} view="week" resources={lanes} />`),
  comp("pro-charts", "Charts", "viz",
    "Declarative chart library: line, bar, area, scatter, donut, heatmap.",
    [
      { name: "type", type: "ChartType", required: true, description: "Chart type." },
      { name: "data", type: "Point[] | Series[]", required: true, description: "Chart data." },
      { name: "height", type: "number", required: false, description: "Pixel height." },
    ],
    `<Chart type="line" data={series} height={320} />`),
  comp("pro-calendar", "Calendar", "viz",
    "Date picker + month calendar with range selection and disabled-day rules.",
    [
      { name: "value", type: "Date | DateRange", required: false, description: "Selected date(s)." },
      { name: "mode", type: "'single' | 'range'", required: false, description: "Selection mode." },
      { name: "min", type: "Date", required: false, description: "Earliest selectable date." },
    ],
    `<Calendar mode="range" value={range} min={today} />`),
  comp("pro-timeline", "Timeline", "viz",
    "Vertical timeline with markers, icons, and grouped events.",
    [
      { name: "events", type: "TimelineEvent[]", required: true, description: "Events list." },
      { name: "groupBy", type: "'day' | 'month'", required: false, description: "Grouping." },
    ],
    `<Timeline events={events} groupBy="day" />`),
  comp("pro-treeview", "TreeView", "nav",
    "Recursive tree with lazy-loaded children, checkboxes, and keyboard nav.",
    [
      { name: "nodes", type: "TreeNode[]", required: true, description: "Tree nodes." },
      { name: "selectable", type: "boolean", required: false, description: "Show checkboxes." },
      { name: "onExpand", type: "(node) => Promise<TreeNode[]>", required: false, description: "Lazy loader." },
    ],
    `<TreeView nodes={nodes} selectable onExpand={loadChildren} />`),
  comp("pro-orgchart", "OrgChart", "nav",
    "Organizational chart with pan/zoom, expand/collapse, and reporting lines.",
    [
      { name: "root", type: "OrgNode", required: true, description: "Root node." },
      { name: "orientation", type: "'horizontal' | 'vertical'", required: false, description: "Layout direction." },
    ],
    `<OrgChart root={ceo} orientation="vertical" />`),
  comp("pro-richtext", "RichTextEditor", "input",
    "WYSIWYG editor with markdown shortcuts, slash commands, and collaborative cursors.",
    [
      { name: "value", type: "string", required: true, description: "Document content (HTML or MD)." },
      { name: "onChange", type: "(value: string) => void", required: false, description: "Change handler." },
      { name: "collaborative", type: "boolean", required: false, description: "Enable multiplayer." },
    ],
    `<RichTextEditor value={doc} onChange={setDoc} collaborative />`),
  comp("pro-pivot", "PivotTable", "data",
    "Pivot table with drag-and-drop fields, aggregations, and drill-down.",
    [
      { name: "data", type: "Record<string, unknown>[]", required: true, description: "Flat data rows." },
      { name: "rows", type: "string[]", required: true, description: "Row dimensions." },
      { name: "values", type: "ValueAgg[]", required: true, description: "Aggregations." },
    ],
    `<PivotTable data={rows} rows={['region']} values={[{field:'sales',agg:'sum'}]} />`),
  comp("pro-combobox", "Combobox", "input",
    "Searchable select with async loading, virtualization, and multi-select.",
    [
      { name: "options", type: "Option[] | (q) => Promise<Option[]>", required: true, description: "Options or loader." },
      { name: "multiple", type: "boolean", required: false, description: "Multi-select." },
    ],
    `<Combobox options={loadUsers} multiple />`),
  comp("pro-daterangepicker", "DateRangePicker", "input",
    "Two-calendar range picker with presets and disabled ranges.",
    [
      { name: "value", type: "DateRange", required: false, description: "Selected range." },
      { name: "presets", type: "Preset[]", required: false, description: "Quick-pick presets." },
    ],
    `<DateRangePicker value={range} presets={presets} />`),
  comp("pro-fileupload", "FileUpload", "input",
    "Drag-and-drop file uploader with chunked upload and progress UI.",
    [
      { name: "endpoint", type: "string", required: true, description: "Upload URL." },
      { name: "multiple", type: "boolean", required: false, description: "Allow multiple files." },
      { name: "accept", type: "string", required: false, description: "Accepted MIME types." },
    ],
    `<FileUpload endpoint="/api/upload" multiple accept="image/*" />`),
  comp("pro-colorpicker", "ColorPicker", "input",
    "OKLCH color picker with hex/rgb/hsl sync and palettes.",
    [
      { name: "value", type: "string", required: true, description: "Current color." },
      { name: "format", type: "'oklch' | 'hex' | 'rgb'", required: false, description: "Output format." },
    ],
    `<ColorPicker value="#10b981" format="oklch" />`),
  comp("pro-command", "CommandPalette", "nav",
    "Cmd+K command palette with fuzzy search and nested commands.",
    [
      { name: "commands", type: "Command[]", required: true, description: "Command list." },
      { name: "placeholder", type: "string", required: false, description: "Search placeholder." },
    ],
    `<CommandPalette commands={cmds} placeholder="Type a command…" />`),
  comp("pro-tabs", "AdvancedTabs", "nav",
    "Tabs with overflow scroll, drag-to-reorder, and pinned tabs.",
    [
      { name: "tabs", type: "Tab[]", required: true, description: "Tab definitions." },
      { name: "onChange", type: "(id: string) => void", required: false, description: "Selection handler." },
    ],
    `<AdvancedTabs tabs={tabs} onChange={setActive} />`),
];

/** List all pro components. Cached. */
export async function listComponents(): Promise<ProComponent[]> {
  return cacheWrap(
    LIST_KEY,
    () => Promise.resolve(SEED_COMPONENTS.map((c) => ({ ...c }))),
    CACHE_TTL.proComponents,
  );
}

/** Get a single pro component by id. Cached. Throws 404 if missing. */
export async function getComponentById(id: string): Promise<ProComponent> {
  return cacheWrap(
    detailKey(id),
    () => {
      const found = SEED_COMPONENTS.find((c) => c.id === id);
      if (!found) throw AppError.notFound(`Pro component '${id}' not found`);
      return Promise.resolve({ ...found });
    },
    CACHE_TTL.proComponentDetail,
  );
}

/** Get a single component's source code. Cached. Throws 404 if missing. */
export async function getComponentCode(
  id: string,
): Promise<{ id: string; code: string; language: "tsx" }> {
  return cacheWrap(
    codeKey(id),
    () => {
      const found = SEED_COMPONENTS.find((c) => c.id === id);
      if (!found) throw AppError.notFound(`Pro component '${id}' not found`);
      return Promise.resolve({
        id: found.id,
        code: `// ${found.name}\n// ${found.description}\n\nexport function ${found.name.replace(/[^a-zA-Z0-9]/g, "")}(props) {\n  // …\n}\n\n// Usage:\n${found.codeSnippet}\n`,
        language: "tsx" as const,
      });
    },
    CACHE_TTL.proComponentCode,
  );
}

/** List categories with component counts. Cached. */
export async function listCategories(): Promise<
  { category: string; count: number }[]
> {
  return cacheWrap(
    CATEGORIES_KEY,
    () => {
      const counts = new Map<string, number>();
      for (const c of SEED_COMPONENTS) {
        counts.set(c.category, (counts.get(c.category) ?? 0) + 1);
      }
      return Promise.resolve(
        [...counts.entries()]
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([category, count]) => ({ category, count })),
      );
    },
    CACHE_TTL.proCategories,
  );
}

/** Number of components in the catalog. */
export function componentsCount(): number {
  return SEED_COMPONENTS.length;
}

log.debug("Pro Components module loaded", {
  components: SEED_COMPONENTS.length,
});
