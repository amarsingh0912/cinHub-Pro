import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Save,
  Trash2,
  Download,
  Star,
  Calendar,
  Sparkles,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useFilterPresets } from "@/hooks/use-filter-presets";
import type { AdvancedFilterState, FilterPreset } from "@/types/filters";
import { format } from "date-fns";

interface FilterPresetsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentFilters: AdvancedFilterState;
  onLoadPreset: (filters: AdvancedFilterState) => void;
}

export function FilterPresetsDialog({
  isOpen,
  onOpenChange,
  currentFilters,
  onLoadPreset,
}: FilterPresetsDialogProps) {
  const { toast } = useToast();
  const {
    presets,
    savePreset,
    deletePreset,
    loadPreset,
    presetNameExists,
    canSaveMore,
    remainingSlots,
  } = useFilterPresets({ maxPresets: 10 });

  const [mode, setMode] = useState<"view" | "save">("view");
  const [presetName, setPresetName] = useState("");
  const [presetDescription, setPresetDescription] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for your preset",
        variant: "destructive",
      });
      return;
    }

    if (presetNameExists(presetName)) {
      toast({
        title: "Name Exists",
        description: "A preset with this name already exists",
        variant: "destructive",
      });
      return;
    }

    const preset = savePreset(presetName, currentFilters, presetDescription);

    if (preset) {
      toast({
        title: "Preset Saved",
        description: `"${presetName}" has been saved successfully`,
      });
      setPresetName("");
      setPresetDescription("");
      setMode("view");
    } else {
      toast({
        title: "Cannot Save",
        description: "Maximum number of presets reached",
        variant: "destructive",
      });
    }
  };

  const handleLoadPreset = (id: string) => {
    const filters = loadPreset(id);
    if (filters) {
      onLoadPreset(filters);
      toast({
        title: "Preset Loaded",
        description: "Filters have been applied",
      });
      onOpenChange(false);
    }
  };

  const handleDeletePreset = (id: string) => {
    const preset = presets.find((p) => p.id === id);
    deletePreset(id);
    toast({
      title: "Preset Deleted",
      description: `"${preset?.name}" has been removed`,
    });
    setDeleteConfirmId(null);
  };

  const getFilterSummary = (preset: FilterPreset) => {
    const parts: string[] = [];
    if (preset.filters.with_genres?.length) parts.push(`${preset.filters.with_genres.length} genres`);
    if (preset.filters.vote_average?.min) parts.push(`${preset.filters.vote_average.min}+ rating`);
    if (preset.filters.primary_release_date?.start || preset.filters.first_air_date?.start) {
      parts.push("date range");
    }
    return parts.length ? parts.join(" • ") : "No filters";
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] glassmorphism">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Filter Presets
            </DialogTitle>
            <DialogDescription>
              Save and load your favorite filter configurations for quick access
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 mb-4">
            <Button
              variant={mode === "view" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("view")}
              className="flex-1"
              data-testid="view-presets-tab"
            >
              <Download className="h-4 w-4 mr-2" />
              My Presets ({presets.length})
            </Button>
            <Button
              variant={mode === "save" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("save")}
              className="flex-1"
              disabled={!canSaveMore}
              data-testid="save-preset-tab"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Current {!canSaveMore && "(Full)"}
            </Button>
          </div>

          {mode === "view" ? (
            <ScrollArea className="h-[400px] pr-4">
              {presets.length === 0 ? (
                <div className="text-center py-12" data-testid="empty-presets">
                  <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">No saved presets yet</p>
                  <p className="text-xs text-muted-foreground">
                    Save your first preset to quickly apply your favorite filters
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {presets.map((preset, index) => (
                      <motion.div
                        key={preset.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ delay: index * 0.05 }}
                        className="group p-4 rounded-lg border border-border/50 hover:border-primary/50 transition-all duration-200 glassmorphism-card"
                        data-testid={`preset-${preset.id}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-sm truncate" data-testid="preset-name">
                                {preset.name}
                              </h3>
                              {preset.usage_count > 0 && (
                                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                  {preset.usage_count}
                                </Badge>
                              )}
                            </div>
                            {preset.description && (
                              <p className="text-xs text-muted-foreground mb-2">{preset.description}</p>
                            )}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{format(new Date(preset.createdAt), "MMM d, yyyy")}</span>
                              <span className="text-muted-foreground/50">•</span>
                              <span>{getFilterSummary(preset)}</span>
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleLoadPreset(preset.id)}
                              className="h-8 px-2"
                              data-testid={`load-preset-${preset.id}`}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirmId(preset.id)}
                              className="h-8 px-2 hover:text-destructive"
                              data-testid={`delete-preset-${preset.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </ScrollArea>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="preset-name">Preset Name</Label>
                <Input
                  id="preset-name"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="e.g., My Sci-Fi Picks"
                  maxLength={50}
                  data-testid="preset-name-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preset-description">Description (Optional)</Label>
                <Textarea
                  id="preset-description"
                  value={presetDescription}
                  onChange={(e) => setPresetDescription(e.target.value)}
                  placeholder="Brief description of this filter preset"
                  maxLength={200}
                  rows={3}
                  data-testid="preset-description-input"
                />
              </div>

              <Separator />

              <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                <p className="text-sm font-medium">Current Filter Summary:</p>
                <p className="text-xs text-muted-foreground">{getFilterSummary({ filters: currentFilters } as FilterPreset)}</p>
              </div>

              {!canSaveMore && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium">Maximum presets reached</p>
                    <p>Delete a preset to save a new one</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {mode === "view" ? (
              <div className="flex items-center justify-between w-full">
                <p className="text-xs text-muted-foreground">
                  {remainingSlots} {remainingSlots === 1 ? "slot" : "slots"} remaining
                </p>
                <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="close-dialog">
                  Close
                </Button>
              </div>
            ) : (
              <div className="flex gap-2 w-full">
                <Button variant="outline" onClick={() => setMode("view")} className="flex-1" data-testid="cancel-save">
                  Cancel
                </Button>
                <Button
                  onClick={handleSavePreset}
                  disabled={!presetName.trim() || !canSaveMore}
                  className="flex-1"
                  data-testid="confirm-save-preset"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Preset
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Preset?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{presets.find((p) => p.id === deleteConfirmId)?.name}". This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDeletePreset(deleteConfirmId)}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
