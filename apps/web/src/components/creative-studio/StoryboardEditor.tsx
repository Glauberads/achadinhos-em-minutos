import React, { useState, useCallback } from 'react';
import { Button, Card, Input } from '../ui/core';
import { ArrowUp, ArrowDown, Copy, Trash2, Undo, Redo, Save, Play } from 'lucide-react';

interface Scene {
  id: string;
  type: string;
  url: string;
  duration: number;
  animation: string;
  text: string;
  colors: string[];
}

interface StoryboardEditorProps {
  initialScenes: Scene[];
  onSave: (scenes: Scene[]) => void;
  onRender: () => void;
}

// Simple Undo/Redo Hook
function useUndoRedo<T>(initialState: T) {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [index, setIndex] = useState(0);

  const setState = (newState: T) => {
    const newHistory = history.slice(0, index + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setIndex(newHistory.length - 1);
  };

  const undo = () => setIndex(Math.max(0, index - 1));
  const redo = () => setIndex(Math.min(history.length - 1, index + 1));

  return [history[index], setState, undo, redo, index > 0, index < history.length - 1] as const;
}

export function StoryboardEditor({ initialScenes, onSave, onRender }: StoryboardEditorProps) {
  const [scenes, setScenes, undo, redo, canUndo, canRedo] = useUndoRedo<Scene[]>(initialScenes);
  const [editingId, setEditingId] = useState<string | null>(null);

  const updateScene = (id: string, updates: Partial<Scene>) => {
    const updated = scenes.map(s => s.id === id ? { ...s, ...updates } : s);
    setScenes(updated);
  };

  const removeScene = (id: string) => {
    setScenes(scenes.filter(s => s.id !== id));
  };

  const duplicateScene = (index: number) => {
    const newScenes = [...scenes];
    const newScene = { ...scenes[index], id: `scene-${Math.random().toString(36).substr(2, 9)}` };
    newScenes.splice(index + 1, 0, newScene);
    setScenes(newScenes);
  };

  const moveScene = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newScenes = [...scenes];
      [newScenes[index - 1], newScenes[index]] = [newScenes[index], newScenes[index - 1]];
      setScenes(newScenes);
    } else if (direction === 'down' && index < scenes.length - 1) {
      const newScenes = [...scenes];
      [newScenes[index + 1], newScenes[index]] = [newScenes[index], newScenes[index + 1]];
      setScenes(newScenes);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Storyboard Inteligente</h2>
          <p className="text-muted-foreground text-sm mt-1">Reorganize, adicione e ajuste as cenas do seu criativo.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={undo} disabled={!canUndo} icon={<Undo className="w-4 h-4" />}>Desfazer</Button>
          <Button variant="ghost" size="sm" onClick={redo} disabled={!canRedo} icon={<Redo className="w-4 h-4" />}>Refazer</Button>
          <Button variant="secondary" onClick={() => onSave(scenes)} icon={<Save className="w-4 h-4" />}>Salvar Rascunho</Button>
          <Button variant="primary" onClick={onRender} icon={<Play className="w-4 h-4" />}>Renderizar Vídeo</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {scenes.map((scene, index) => (
          <div key={scene.id} className="relative group bg-secondary/20 rounded-xl border border-border/50 overflow-hidden hover:shadow-md transition-shadow">
            
            {/* Header / Actions */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-background/80 backdrop-blur rounded p-1">
              <button onClick={() => moveScene(index, 'up')} disabled={index === 0} className="p-1.5 hover:text-primary disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
              <button onClick={() => moveScene(index, 'down')} disabled={index === scenes.length - 1} className="p-1.5 hover:text-primary disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
              <button onClick={() => duplicateScene(index)} className="p-1.5 hover:text-primary"><Copy className="w-4 h-4" /></button>
              <button onClick={() => removeScene(scene.id)} className="p-1.5 hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
            </div>

            {/* Media Preview */}
            <div className="relative aspect-[9/16] bg-black/50 overflow-hidden">
              <img src={scene.url} alt="Scene Media" className="w-full h-full object-cover opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-4">
                {editingId === scene.id ? (
                  <textarea 
                    value={scene.text}
                    onChange={(e) => updateScene(scene.id, { text: e.target.value })}
                    className="w-full bg-black/60 text-white border border-white/20 rounded p-2 text-sm outline-none resize-none"
                    rows={3}
                  />
                ) : (
                  <p className="text-white font-bold text-center drop-shadow-md text-lg leading-tight" onClick={() => setEditingId(scene.id)}>{scene.text}</p>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold">Cena {index + 1}</span>
                <button onClick={() => setEditingId(editingId === scene.id ? null : scene.id)} className="text-primary hover:underline font-medium text-xs">
                  {editingId === scene.id ? 'Salvar Texto' : 'Editar Texto'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-muted-foreground mb-1">Duração (s)</label>
                  <Input type="number" value={scene.duration} onChange={(e) => updateScene(scene.id, { duration: Number(e.target.value) })} className="h-8 text-xs" />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">Efeito</label>
                  <select 
                    value={scene.animation}
                    onChange={(e) => updateScene(scene.id, { animation: e.target.value })}
                    className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="static">Estático</option>
                    <option value="zoom-in">Zoom In</option>
                    <option value="zoom-in-fast">Zoom Rápido</option>
                    <option value="pan-right">Panorâmica</option>
                    <option value="fade">Fade</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
