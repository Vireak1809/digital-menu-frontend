import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, ImagePlus, EyeOff, Eye } from 'lucide-react';
import * as ep from '../../shared/api/endpoints';
import { Badge, Button, Field, Input, Modal, Select, Textarea, EmptyState } from '../../shared/components/ui';
import { toast } from '../../shared/components/Toaster';
import type { Category, MenuItem } from '../../shared/types';

export default function MenuManagerPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'items' | 'categories'>('items');
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: ep.listCategories });
  const { data: items = [], isLoading } = useQuery({ queryKey: ['menu-items'], queryFn: () => ep.listMenuItems() });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['menu-items'] });
    qc.invalidateQueries({ queryKey: ['categories'] });
  };

  const saveItem = useMutation({
    mutationFn: (payload: Partial<MenuItem>) =>
      payload.id ? ep.updateMenuItem(payload.id, payload) : ep.createMenuItem(payload as never),
    onSuccess: () => { toast.success('Menu item saved'); setEditingItem(null); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeItem = useMutation({
    mutationFn: (id: string) => ep.deleteMenuItem(id),
    onSuccess: () => { toast.success('Item deleted'); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleAvailability = useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) => ep.setItemAvailability(id, isAvailable),
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast.error(e.message),
  });

  const saveCategory = useMutation({
    mutationFn: (payload: Partial<Category>) =>
      payload.id ? ep.updateCategory(payload.id, payload) : ep.createCategory(payload as never),
    onSuccess: () => { toast.success('Category saved'); setEditingCategory(null); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeCategory = useMutation({
    mutationFn: (id: string) => ep.deleteCategory(id),
    onSuccess: () => { toast.success('Category deleted'); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Menu management</h1>
          <p className="text-sm text-slate-500">{items.length} items · {categories.length} categories</p>
        </div>
        <Button onClick={() => (tab === 'items' ? setEditingItem({ isAvailable: true, prepTime: 10, tags: [], price: 0 }) : setEditingCategory({ isActive: true, sortOrder: categories.length }))}>
          <Plus size={17} /> New {tab === 'items' ? 'item' : 'category'}
        </Button>
      </div>

      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/60 w-fit">
        {(['items', 'categories'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold capitalize transition ${
              tab === t ? 'bg-white shadow-sm dark:bg-slate-900' : 'text-slate-500'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'items' ? (
        isLoading ? (
          <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-16" />)}</div>
        ) : items.length === 0 ? (
          <EmptyState title="No menu items" description="Create your first dish to get started." />
        ) : (
          <div className="card divide-y divide-slate-100 dark:divide-slate-800">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3.5">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                  {item.image ? <img src={item.image} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xl">🍴</div>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-bold">{item.name}</p>
                    {!item.isAvailable && <Badge tone="red">Out of stock</Badge>}
                  </div>
                  <p className="truncate text-xs text-slate-500">
                    {item.category?.name} · ${Number(item.price).toFixed(2)} · {item.prepTime} min
                  </p>
                </div>
                <button onClick={() => toggleAvailability.mutate({ id: item.id, isAvailable: !item.isAvailable })} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" title={item.isAvailable ? 'Mark out of stock' : 'Mark available'}>
                  {item.isAvailable ? <Eye size={17} /> : <EyeOff size={17} />}
                </button>
                <button onClick={() => setEditingItem(item)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><Pencil size={17} /></button>
                <button
                  onClick={() => { if (confirm(`Delete “${item.name}”?`)) removeItem.mutate(item.id); }}
                  className="rounded-lg p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="card divide-y divide-slate-100 dark:divide-slate-800">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center gap-3 p-3.5">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                {c.image ? <img src={c.image} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-lg">📁</div>}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{c.name}</p>
                <p className="text-xs text-slate-500">
                  {c.isActive ? 'Active' : 'Hidden'} · sort {c.sortOrder}
                </p>
              </div>
              <button onClick={() => setEditingCategory(c)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><Pencil size={17} /></button>
              <button
                onClick={() => { if (confirm(`Delete “${c.name}” and all its items?`)) removeCategory.mutate(c.id); }}
                className="rounded-lg p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))}
          {categories.length === 0 && <EmptyState title="No categories" />}
        </div>
      )}

      {/* ---------- Item modal ---------- */}
      <Modal open={Boolean(editingItem)} onClose={() => setEditingItem(null)} title={editingItem?.id ? 'Edit item' : 'New item'} wide>
        {editingItem && (
          <ItemForm
            value={editingItem}
            categories={categories}
            onChange={setEditingItem}
            onSave={() => saveItem.mutate(editingItem)}
            saving={saveItem.isPending}
          />
        )}
      </Modal>

      {/* ---------- Category modal ---------- */}
      <Modal open={Boolean(editingCategory)} onClose={() => setEditingCategory(null)} title={editingCategory?.id ? 'Edit category' : 'New category'}>
        {editingCategory && (
          <div className="space-y-4">
            <Field label="Name">
              <Input value={editingCategory.name ?? ''} onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })} />
            </Field>
            <Field label="Image URL">
              <Input value={editingCategory.image ?? ''} onChange={(e) => setEditingCategory({ ...editingCategory, image: e.target.value })} placeholder="https://…" />
            </Field>
            <Field label="Sort order">
              <Input type="number" value={editingCategory.sortOrder ?? 0} onChange={(e) => setEditingCategory({ ...editingCategory, sortOrder: Number(e.target.value) })} />
            </Field>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={editingCategory.isActive ?? true} onChange={(e) => setEditingCategory({ ...editingCategory, isActive: e.target.checked })} />
              Visible to customers
            </label>
            <Button className="w-full" onClick={() => saveCategory.mutate(editingCategory)} disabled={saveCategory.isPending || !editingCategory.name}>
              Save category
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}

function ItemForm({
  value, categories, onChange, onSave, saving,
}: {
  value: Partial<MenuItem>;
  categories: Category[];
  onChange: (v: Partial<MenuItem>) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const { url } = await ep.uploadImage(file);
      onChange({ ...value, image: url });
      toast.success('Image uploaded');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name">
          <Input value={value.name ?? ''} onChange={(e) => onChange({ ...value, name: e.target.value })} />
        </Field>
        <Field label="Category">
          <Select value={value.categoryId ?? ''} onChange={(e) => onChange({ ...value, categoryId: e.target.value })}>
            <option value="">Select…</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="Price">
          <Input type="number" step="0.01" min="0" value={value.price ?? 0} onChange={(e) => onChange({ ...value, price: Number(e.target.value) })} />
        </Field>
        <Field label="Prep time (minutes)">
          <Input type="number" min="0" value={value.prepTime ?? 10} onChange={(e) => onChange({ ...value, prepTime: Number(e.target.value) })} />
        </Field>
      </div>

      <Field label="Description">
        <Textarea value={value.description ?? ''} onChange={(e) => onChange({ ...value, description: e.target.value })} />
      </Field>

      <Field label="Tags (comma separated)">
        <Input
          value={(value.tags ?? []).join(', ')}
          onChange={(e) => onChange({ ...value, tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })}
          placeholder="veg, spicy, popular"
        />
      </Field>

      <div>
        <span className="label">Image</span>
        <div className="flex items-center gap-3">
          {value.image && <img src={value.image} alt="" className="h-16 w-16 rounded-xl object-cover" />}
          <label className="btn-outline cursor-pointer">
            <ImagePlus size={16} /> {uploading ? 'Uploading…' : 'Upload'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleUpload(f); }}
            />
          </label>
          {value.image && <Button variant="ghost" onClick={() => onChange({ ...value, image: null })}>Remove</Button>}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" checked={value.isAvailable ?? true} onChange={(e) => onChange({ ...value, isAvailable: e.target.checked })} />
        Available for ordering
      </label>

      <Button className="w-full" onClick={onSave} disabled={saving || !value.name || !value.categoryId}>
        Save item
      </Button>
    </div>
  );
}