"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FolderPlus, Folder, X, Trash2, Copy, Check, Plus, Search } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { effects } from "@/lib/roycss-effects";
import type { CSSEffect } from "@/lib/roycss-types";
import { LivePreview } from "@/components/roycss/effect-card";

const STORAGE_KEY = "roycss-custom-collections";

interface CustomCollection {
  id: string;
  name: string;
  description: string;
  effectIds: string[];
  createdAt: number;
}

function getCollections(): CustomCollection[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}

function saveCollections(collections: CustomCollection[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(collections));
  window.dispatchEvent(new CustomEvent("roycss-collections-change"));
}

interface CustomCollectionsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectEffect: (effect: CSSEffect) => void;
}

export function CustomCollectionsSheet({ open, onOpenChange, onSelectEffect }: CustomCollectionsProps) {
  const [collections, setCollections] = useState<CustomCollection[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setCollections(getCollections());
    update();
    window.addEventListener("roycss-collections-change", update);
    return () => window.removeEventListener("roycss-collections-change", update);
  }, []);

  const handleCreate = useCallback(() => {
    if (!newName.trim()) return;
    const col: CustomCollection = {
      id: `custom-${Date.now()}`,
      name: newName.trim(),
      description: newDesc.trim() || "My custom collection",
      effectIds: [],
      createdAt: Date.now(),
    };
    const updated = [col, ...getCollections()];
    saveCollections(updated);
    setNewName("");
    setNewDesc("");
    setCreating(false);
    setExpandedId(col.id);
  }, [newName, newDesc]);

  const handleDelete = useCallback((id: string) => {
    const updated = getCollections().filter(c => c.id !== id);
    saveCollections(updated);
  }, []);

  const handleAddEffect = useCallback((colId: string, effectId: string) => {
    const cols = getCollections();
    const col = cols.find(c => c.id === colId);
    if (!col || col.effectIds.includes(effectId)) return;
    col.effectIds.push(effectId);
    saveCollections(cols);
  }, []);

  const handleRemoveEffect = useCallback((colId: string, effectId: string) => {
    const cols = getCollections();
    const col = cols.find(c => c.id === colId);
    if (!col) return;
    col.effectIds = col.effectIds.filter(id => id !== effectId);
    saveCollections(cols);
  }, []);

  const handleExport = useCallback(async (col: CustomCollection) => {
    const css = col.effectIds
      .map(id => effects.find(e => e.id === id)?.cssCode)
      .filter(Boolean)
      .join("\n\n");
    try {
      await navigator.clipboard.writeText(css);
      setCopiedId(col.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch { /* noop */ }
  }, []);

  const filteredEffects = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return effects.slice(0, 20);
    return effects.filter(e => e.name.toLowerCase().includes(q) || e.id.includes(q)).slice(0, 20);
  }, [search]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-0">
        <SheetHeader className="p-5 pb-3 text-left border-b border-border/50">
          <SheetTitle className="flex items-center gap-2 font-display text-lg">
            <FolderPlus className="size-5 text-primary" />
            My Collections
          </SheetTitle>
          <SheetDescription>
            Create custom effect bundles. Add effects, export CSS, organize your favorites.
          </SheetDescription>
        </SheetHeader>

        <div className="p-5 space-y-4">
          {/* Create button */}
          {!creating && (
            <button
              onClick={() => setCreating(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-primary/30 text-primary hover:bg-primary/5 transition-all cursor-pointer text-sm font-medium"
            >
              <FolderPlus className="size-4" /> Create New Collection
            </button>
          )}

          {/* Create form */}
          <AnimatePresence>
            {creating && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="p-3 rounded-xl border border-border/50 bg-muted/20 space-y-2">
                  <Input placeholder="Collection name (e.g., 'My Landing Page Effects')" value={newName} onChange={(e) => setNewName(e.target.value)} className="h-9" />
                  <Input placeholder="Description (optional)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="h-9" />
                  <div className="flex items-center gap-2">
                    <button onClick={handleCreate} disabled={!newName.trim()} className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50 transition-all cursor-pointer">Create</button>
                    <button onClick={() => { setCreating(false); setNewName(""); setNewDesc(""); }} className="px-3 py-2 rounded-lg bg-muted text-muted-foreground text-xs font-medium hover:bg-muted/80 transition-all cursor-pointer">Cancel</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Collections list */}
          {collections.length === 0 && !creating ? (
            <div className="text-center py-8">
              <Folder className="size-12 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="font-display text-base font-semibold text-foreground">No collections yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">Create a collection to organize your favorite effects.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {collections.map(col => {
                const isExpanded = expandedId === col.id;
                const colEffects = col.effectIds.map(id => effects.find(e => e.id === id)).filter((e): e is CSSEffect => !!e);
                return (
                  <div key={col.id} className="rounded-xl border border-border/50 bg-card overflow-hidden">
                    {/* Header */}
                    <div
                      onClick={() => setExpandedId(isExpanded ? null : col.id)}
                      className="flex items-center gap-2 p-3 cursor-pointer hover:bg-muted/30 transition-all"
                    >
                      <Folder className={`size-4 text-primary shrink-0 ${isExpanded ? "fill-primary/20" : ""}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{col.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{col.effectIds.length} effects · {col.description}</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(col.id); }} className="flex items-center justify-center size-7 rounded-lg text-muted-foreground hover:text-rose-500 transition-all cursor-pointer shrink-0" aria-label="Delete collection">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>

                    {/* Expanded content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-border/40">
                          <div className="p-3 space-y-2">
                            {/* Existing effects */}
                            {colEffects.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                {colEffects.map(e => (
                                  <div key={e.id} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs group">
                                    <button onClick={() => onSelectEffect(e)} className="cursor-pointer">{e.name}</button>
                                    <button onClick={() => handleRemoveEffect(col.id, e.id)} className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                      <X className="size-2.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Export button */}
                            {colEffects.length > 0 && (
                              <button
                                onClick={() => handleExport(col)}
                                className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${copiedId === col.id ? "bg-emerald-500/15 text-emerald-500" : "bg-muted text-foreground hover:bg-muted/80"}`}
                              >
                                {copiedId === col.id ? <Check className="size-3" /> : <Copy className="size-3" />}
                                {copiedId === col.id ? "CSS Copied!" : `Export ${colEffects.length} effects as CSS`}
                              </button>
                            )}

                            {/* Search to add */}
                            <Input type="search" placeholder="Search effects to add..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 text-xs" />
                            <div className="max-h-32 overflow-y-auto scrollbar-thin space-y-0.5">
                              {filteredEffects.map(e => {
                                const inCol = col.effectIds.includes(e.id);
                                return (
                                  <button
                                    key={e.id}
                                    onClick={() => inCol ? handleRemoveEffect(col.id, e.id) : handleAddEffect(col.id, e.id)}
                                    className={`w-full flex items-center gap-2 p-1.5 rounded-lg transition-all cursor-pointer text-left ${inCol ? "bg-primary/10" : "hover:bg-muted/50"}`}
                                  >
                                    <div className="flex items-center justify-center size-6 rounded bg-muted/40 border border-border/50 overflow-hidden shrink-0">
                                      <div className="scale-[0.3] origin-center"><LivePreview effect={e} /></div>
                                    </div>
                                    <span className="text-xs text-foreground truncate flex-1">{e.name}</span>
                                    <div className={`flex items-center justify-center size-5 rounded-full shrink-0 ${inCol ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                                      {inCol ? <X className="size-2.5" /> : <Plus className="size-2.5" />}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
