import { useState, useEffect, useCallback } from ‘react’;
import { supabase } from ‘./supabaseClient’;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n) => (n ? ‘$’ + Number(n).toLocaleString() : ‘$0’);

const STATUS_STYLE = {
Available:    { bg: ‘#e6f4ea’, text: ‘#1e6e3a’ },
‘Under Offer’:{ bg: ‘#fff3cd’, text: ‘#856404’ },
Sold:         { bg: ‘#fde8e8’, text: ‘#9b1c1c’ },
};

const TABS = [‘Listings’, ‘Buyers’, ‘Add Property’, ‘Buyer Inquiry’];

const EMPTY_PROP = {
title: ‘’, address: ‘’, price: ‘’, type: ‘House’,
beds: ‘’, baths: ‘’, sqft: ‘’, status: ‘Available’,
description: ‘’, image: ‘’,
};

const EMPTY_BUYER = {
name: ‘’, email: ‘’, phone: ‘’,
budget: ‘’, interest: ‘Any’, notes: ‘’,
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function Stat({ label, value }) {
return (
<div style={S.statBox}>
<div style={S.statVal}>{value}</div>
<div style={S.statLabel}>{label}</div>
</div>
);
}

function Field({ label, value, onChange, placeholder, type = ‘text’, span }) {
return (
<div style={{ …S.field, …(span ? { gridColumn: ‘1 / -1’ } : {}) }}>
<label style={S.label}>{label}</label>
<input
type={type} value={value}
onChange={(e) => onChange(e.target.value)}
placeholder={placeholder} style={S.input}
/>
</div>
);
}

function SelField({ label, value, onChange, options, span }) {
return (
<div style={{ …S.field, …(span ? { gridColumn: ‘1 / -1’ } : {}) }}>
<label style={S.label}>{label}</label>
<select value={value} onChange={(e) => onChange(e.target.value)} style={S.select}>
{options.map((o) => <option key={o}>{o}</option>)}
</select>
</div>
);
}

function Toast({ msg }) {
return msg ? <div style={S.toast}>{msg}</div> : null;
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
const [tab, setTab]             = useState(‘Listings’);
const [properties, setProperties] = useState([]);
const [buyers, setBuyers]       = useState([]);
const [loading, setLoading]     = useState(true);
const [error, setError]         = useState(null);
const [search, setSearch]       = useState(’’);
const [filterType, setFilterType]     = useState(‘All’);
const [filterStatus, setFilterStatus] = useState(‘All’);
const [selected, setSelected]   = useState(null);
const [toast, setToast]         = useState(null);
const [saving, setSaving]       = useState(false);

const [newProp, setNewProp]           = useState(EMPTY_PROP);
const [contactForm, setContactForm]   = useState(EMPTY_BUYER);

// ── Show toast helper
function flash(msg) {
setToast(msg);
setTimeout(() => setToast(null), 3200);
}

// ── Load data from Supabase
const loadAll = useCallback(async () => {
setLoading(true);
setError(null);
try {
const [{ data: props, error: pe }, { data: buys, error: be }] =
await Promise.all([
supabase.from(‘properties’).select(’*’).order(‘created_at’, { ascending: false }),
supabase.from(‘buyers’).select(’*’).order(‘created_at’, { ascending: false }),
]);

```
  if (pe) throw pe;
  if (be) throw be;

  setProperties(props || []);
  setBuyers(buys || []);
} catch (e) {
  setError('Could not connect to database. Check your Supabase credentials in supabaseClient.js');
} finally {
  setLoading(false);
}
```

}, []);

useEffect(() => { loadAll(); }, [loadAll]);

// ── Filtered listings
const filtered = properties.filter((p) => {
const q = search.toLowerCase();
return (
(p.title?.toLowerCase().includes(q) || p.address?.toLowerCase().includes(q)) &&
(filterType === ‘All’   || p.type === filterType) &&
(filterStatus === ‘All’ || p.status === filterStatus)
);
});

// ── Add property
async function addProperty() {
if (!newProp.title || !newProp.address || !newProp.price) {
flash(‘⚠️ Title, Address, and Price are required.’);
return;
}
setSaving(true);
const row = {
title:       newProp.title,
address:     newProp.address,
price:       Number(newProp.price),
type:        newProp.type,
beds:        Number(newProp.beds)  || 0,
baths:       Number(newProp.baths) || 0,
sqft:        Number(newProp.sqft)  || 0,
status:      newProp.status,
description: newProp.description,
image:       newProp.image || ‘https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80’,
};
const { error } = await supabase.from(‘properties’).insert([row]);
if (error) { flash(’❌ Save failed: ’ + error.message); }
else {
flash(‘✓ Property saved to database!’);
setNewProp(EMPTY_PROP);
setTab(‘Listings’);
await loadAll();
}
setSaving(false);
}

// ── Submit buyer inquiry
async function submitBuyer() {
if (!contactForm.name || !contactForm.email) {
flash(‘⚠️ Name and Email are required.’);
return;
}
setSaving(true);
const row = {
name:     contactForm.name,
email:    contactForm.email,
phone:    contactForm.phone,
budget:   Number(contactForm.budget) || 0,
interest: contactForm.interest,
notes:    contactForm.notes,
};
const { error } = await supabase.from(‘buyers’).insert([row]);
if (error) { flash(’❌ Save failed: ’ + error.message); }
else {
flash(‘✓ Buyer inquiry saved!’);
setContactForm(EMPTY_BUYER);
setTab(‘Buyers’);
await loadAll();
}
setSaving(false);
}

// ── Update property status
async function updateStatus(id, status) {
const { error } = await supabase.from(‘properties’).update({ status }).eq(‘id’, id);
if (!error) {
setProperties((prev) => prev.map((p) => p.id === id ? { …p, status } : p));
setSelected((prev) => prev ? { …prev, status } : prev);
flash(‘✓ Status updated.’);
}
}

// ── Delete property
async function deleteProp(id) {
const { error } = await supabase.from(‘properties’).delete().eq(‘id’, id);
if (!error) {
setProperties((prev) => prev.filter((p) => p.id !== id));
setSelected(null);
flash(‘Property removed.’);
}
}

// ── Delete buyer
async function deleteBuyer(id) {
const { error } = await supabase.from(‘buyers’).delete().eq(‘id’, id);
if (!error) {
setBuyers((prev) => prev.filter((b) => b.id !== id));
flash(‘Buyer removed.’);
}
}

// ── LOADING SCREEN
if (loading) {
return (
<div style={{ …S.root, display: ‘flex’, alignItems: ‘center’, justifyContent: ‘center’, minHeight: ‘100vh’ }}>
<div style={{ textAlign: ‘center’, color: ‘#8a7560’ }}>
<div style={{ fontSize: 48, marginBottom: 14 }}>⌂</div>
<div style={{ fontSize: 15, letterSpacing: 3, textTransform: ‘uppercase’ }}>Loading EstateDesk…</div>
</div>
</div>
);
}

// ── ERROR SCREEN
if (error) {
return (
<div style={{ …S.root, display: ‘flex’, alignItems: ‘center’, justifyContent: ‘center’, minHeight: ‘100vh’, padding: 24 }}>
<div style={{ background: ‘#fff’, borderRadius: 14, padding: 32, maxWidth: 520, border: ‘1.5px solid #fca5a5’, textAlign: ‘center’ }}>
<div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
<div style={{ fontSize: 17, fontWeight: ‘bold’, color: ‘#9b1c1c’, marginBottom: 12 }}>Database Not Connected</div>
<div style={{ color: ‘#5a4a3a’, lineHeight: 1.7, fontSize: 14 }}>{error}</div>
<div style={{ marginTop: 20, background: ‘#faf7f2’, borderRadius: 8, padding: ‘14px 18px’, fontSize: 13, color: ‘#5a4a3a’, textAlign: ‘left’ }}>
<strong>Quick fix:</strong><br/>
1. Open <code>src/supabaseClient.js</code><br/>
2. Replace <code>YOUR_PROJECT_ID</code> and <code>YOUR_ANON_PUBLIC_KEY</code><br/>
3. Save and refresh
</div>
<button onClick={loadAll} style={{ …S.primaryBtn, marginTop: 20, width: ‘auto’, padding: ‘12px 28px’ }}>
Retry Connection
</button>
</div>
</div>
);
}

// ── MAIN UI
return (
<div style={S.root}>
{/* HEADER */}
<header style={S.header}>
<div style={S.headerInner}>
<div>
<div style={S.logo}>⌂ EstateDesk</div>
<div style={S.logoSub}>Property Management · Powered by Supabase</div>
</div>
<div style={S.stats}>
<Stat label='Total'        value={properties.length} />
<Stat label=‘Available’    value={properties.filter((p) => p.status === ‘Available’).length} />
<Stat label=‘Under Offer’  value={properties.filter((p) => p.status === ‘Under Offer’).length} />
<Stat label=‘Sold’         value={properties.filter((p) => p.status === ‘Sold’).length} />
<Stat label='Buyers'       value={buyers.length} />
</div>
</div>
<nav style={S.nav}>
{TABS.map((t) => (
<button key={t} onClick={() => setTab(t)}
style={{ …S.navBtn, …(tab === t ? S.navActive : {}) }}>
{t === ‘Listings’      && ’🏠 ’}
{t === ‘Buyers’        && ’👥 ’}
{t === ‘Add Property’  && ’＋ ’}
{t === ‘Buyer Inquiry’ && ’✉ ’}
{t}
</button>
))}
</nav>
</header>

```
  <main style={S.main}>

    {/* ── LISTINGS ── */}
    {tab === 'Listings' && (
      <div>
        <div style={S.filterBar}>
          <input
            placeholder='🔍  Search by name or address…'
            value={search} onChange={(e) => setSearch(e.target.value)}
            style={S.searchInput}
          />
          <div style={S.filterGroup}>
            <span style={S.filterLabel}>Type:</span>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ ...S.select, padding: '9px 12px' }}>
              {['All','House','Condo','Apartment','Land'].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div style={S.filterGroup}>
            <span style={S.filterLabel}>Status:</span>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ ...S.select, padding: '9px 12px' }}>
              {['All','Available','Under Offer','Sold'].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <button onClick={loadAll} style={S.refreshBtn} title='Refresh data'>↻</button>
        </div>

        {properties.length === 0 && (
          <div style={S.emptyState}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>🏠</div>
            <div style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>No listings yet</div>
            <div style={{ color: '#8a7560', marginBottom: 22 }}>Add your first property to get started</div>
            <button onClick={() => setTab('Add Property')} style={{ ...S.primaryBtn, width: 'auto', padding: '12px 28px' }}>
              ＋ Add First Property
            </button>
          </div>
        )}

        {properties.length > 0 && filtered.length === 0 && (
          <div style={S.emptyState}><div style={{ color: '#8a7560' }}>No properties match your filters.</div></div>
        )}

        <div style={S.grid}>
          {filtered.map((p) => (
            <div key={p.id} style={S.card} onClick={() => setSelected(p)}>
              <div style={{ position: 'relative' }}>
                <img src={p.image} alt={p.title} style={S.cardImg}
                  onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80'} />
                <span style={{ ...S.badge, background: STATUS_STYLE[p.status]?.bg, color: STATUS_STYLE[p.status]?.text }}>
                  {p.status}
                </span>
                <span style={S.typeBadge}>{p.type}</span>
              </div>
              <div style={S.cardBody}>
                <div style={S.cardPrice}>{fmt(p.price)}</div>
                <div style={S.cardTitle}>{p.title}</div>
                <div style={S.cardAddr}>📍 {p.address}</div>
                <div style={S.cardMeta}>
                  {p.beds  > 0 && <span>🛏 {p.beds} bd</span>}
                  {p.baths > 0 && <span>🚿 {p.baths} ba</span>}
                  {p.sqft  > 0 && <span>📐 {Number(p.sqft).toLocaleString()} sqft</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* ── BUYERS ── */}
    {tab === 'Buyers' && (
      <div>
        <div style={S.sectionTitle}>Interested Buyers ({buyers.length})</div>
        {buyers.length === 0 && (
          <div style={S.emptyState}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>👥</div>
            <div style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>No buyer inquiries yet</div>
            <div style={{ color: '#8a7560' }}>Share the 'Buyer Inquiry' tab with potential buyers to capture their details.</div>
          </div>
        )}
        <div style={S.buyerList}>
          {buyers.map((b) => (
            <div key={b.id} style={S.buyerCard}>
              <div style={S.buyerAvatar}>{b.name?.charAt(0)?.toUpperCase()}</div>
              <div style={{ flex: 1 }}>
                <div style={S.buyerName}>{b.name}</div>
                <div style={S.buyerDetail}>✉ {b.email}{b.phone ? ` · 📞 ${b.phone}` : ''}</div>
                <div style={S.buyerDetail}>
                  💰 Budget: <strong>{b.budget ? fmt(b.budget) : 'Not specified'}</strong>
                  {b.interest ? <> · Looking for: <strong>{b.interest}</strong></> : null}
                </div>
                {b.notes && <div style={S.buyerNotes}>'{b.notes}'</div>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                <div style={S.buyerDate}>{b.created_at?.split('T')[0]}</div>
                <button onClick={() => deleteBuyer(b.id)} style={S.smallDeleteBtn}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* ── ADD PROPERTY ── */}
    {tab === 'Add Property' && (
      <div style={S.formWrap}>
        <div style={S.sectionTitle}>Add New Property Listing</div>
        <div style={S.dbBadge}>🟢 Connected to Supabase — data saves permanently</div>
        <div style={S.formGrid}>
          <Field label='Property Title *'  value={newProp.title}       onChange={(v) => setNewProp((p) => ({ ...p, title: v }))}       placeholder='e.g. Sunset Ridge Villa' />
          <Field label='Address *'          value={newProp.address}     onChange={(v) => setNewProp((p) => ({ ...p, address: v }))}     placeholder='123 Main St, City, State ZIP' />
          <Field label='Asking Price ($) *' value={newProp.price}       onChange={(v) => setNewProp((p) => ({ ...p, price: v }))}       placeholder='e.g. 750000' type='number' />
          <SelField label='Property Type'   value={newProp.type}        onChange={(v) => setNewProp((p) => ({ ...p, type: v }))}        options={['House','Condo','Apartment','Land']} />
          <Field label='Bedrooms'           value={newProp.beds}        onChange={(v) => setNewProp((p) => ({ ...p, beds: v }))}        placeholder='e.g. 3' type='number' />
          <Field label='Bathrooms'          value={newProp.baths}       onChange={(v) => setNewProp((p) => ({ ...p, baths: v }))}       placeholder='e.g. 2' type='number' />
          <Field label='Square Footage'     value={newProp.sqft}        onChange={(v) => setNewProp((p) => ({ ...p, sqft: v }))}        placeholder='e.g. 2200' type='number' />
          <SelField label='Listing Status'  value={newProp.status}      onChange={(v) => setNewProp((p) => ({ ...p, status: v }))}      options={['Available','Under Offer','Sold']} />
          <Field label='Photo URL (optional)' value={newProp.image}     onChange={(v) => setNewProp((p) => ({ ...p, image: v }))}       placeholder='https://...' span />
          <div style={{ ...S.field, gridColumn: '1 / -1' }}>
            <label style={S.label}>Description</label>
            <textarea
              value={newProp.description}
              onChange={(e) => setNewProp((p) => ({ ...p, description: e.target.value }))}
              placeholder='Describe the property features, highlights, nearby amenities…'
              style={{ ...S.input, height: 100, resize: 'vertical' }}
            />
          </div>
        </div>
        <button onClick={addProperty} disabled={saving} style={{ ...S.primaryBtn, opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving…' : '💾 Save to Database'}
        </button>
      </div>
    )}

    {/* ── BUYER INQUIRY ── */}
    {tab === 'Buyer Inquiry' && (
      <div style={S.formWrap}>
        <div style={S.sectionTitle}>Buyer Inquiry Form</div>
        <p style={{ color: '#8a7560', marginBottom: 22, fontSize: 14, lineHeight: 1.7 }}>
          Interested buyers fill out this form. Their details are permanently saved in the Buyers tab so your dad can follow up directly.
        </p>
        <div style={S.formGrid}>
          <Field label='Full Name *'         value={contactForm.name}     onChange={(v) => setContactForm((p) => ({ ...p, name: v }))}     placeholder='Jane Smith' />
          <Field label='Email Address *'     value={contactForm.email}    onChange={(v) => setContactForm((p) => ({ ...p, email: v }))}    placeholder='jane@email.com' type='email' />
          <Field label='Phone Number'        value={contactForm.phone}    onChange={(v) => setContactForm((p) => ({ ...p, phone: v }))}    placeholder='555-000-1234' />
          <Field label='Max Budget ($)'      value={contactForm.budget}   onChange={(v) => setContactForm((p) => ({ ...p, budget: v }))}   placeholder='e.g. 600000' type='number' />
          <SelField label='Interested In'    value={contactForm.interest} onChange={(v) => setContactForm((p) => ({ ...p, interest: v }))} options={['Any','House','Condo','Apartment','Land']} />
          <div style={{ ...S.field, gridColumn: '1 / -1' }}>
            <label style={S.label}>Requirements & Notes</label>
            <textarea
              value={contactForm.notes}
              onChange={(e) => setContactForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder='e.g. Need 3+ beds, good school district, pre-approved for mortgage…'
              style={{ ...S.input, height: 100, resize: 'vertical' }}
            />
          </div>
        </div>
        <button onClick={submitBuyer} disabled={saving} style={{ ...S.primaryBtn, opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving…' : '✉ Submit Inquiry'}
        </button>
      </div>
    )}
  </main>

  {/* ── PROPERTY DETAIL MODAL ── */}
  {selected && (
    <div style={S.overlay} onClick={() => setSelected(null)}>
      <div style={S.modal} onClick={(e) => e.stopPropagation()}>
        <img src={selected.image} alt={selected.title} style={S.modalImg}
          onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80'} />
        <div style={S.modalBody}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div>
              <div style={S.modalPrice}>{fmt(selected.price)}</div>
              <div style={S.modalTitle}>{selected.title}</div>
              <div style={S.cardAddr}>📍 {selected.address}</div>
            </div>
            <button onClick={() => setSelected(null)} style={S.closeBtn}>✕</button>
          </div>
          <div style={{ ...S.cardMeta, marginBottom: 14 }}>
            {selected.beds  > 0 && <span>🛏 {selected.beds} Beds</span>}
            {selected.baths > 0 && <span>🚿 {selected.baths} Baths</span>}
            {selected.sqft  > 0 && <span>📐 {Number(selected.sqft).toLocaleString()} sqft</span>}
            <span>🏷 {selected.type}</span>
          </div>
          {selected.description && (
            <p style={{ color: '#5a4a3a', lineHeight: 1.7, marginBottom: 20, fontSize: 14 }}>{selected.description}</p>
          )}
          <div style={{ borderTop: '1px solid #ede4d8', paddingTop: 16 }}>
            <div style={{ fontSize: 11, color: '#8a7560', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.6 }}>Update Status</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {['Available','Under Offer','Sold'].map((st) => (
                <button key={st} onClick={() => updateStatus(selected.id, st)}
                  style={{ ...S.statusBtn, ...(selected.status === st ? S.statusBtnActive : {}) }}>
                  {st}
                </button>
              ))}
              <button onClick={() => deleteProp(selected.id)} style={S.deleteBtn}>🗑 Remove</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )}

  <Toast msg={toast} />
</div>
```

);
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
root:        { fontFamily: ‘‘Georgia’,‘Times New Roman’,serif’, background: ‘#faf7f2’, minHeight: ‘100vh’, color: ‘#2d1f0e’ },
header:      { background: ‘linear-gradient(135deg,#1a0f05 0%,#4a2c0a 60%,#6b3d12 100%)’, color: ‘#f5ead8’ },
headerInner: { display: ‘flex’, justifyContent: ‘space-between’, alignItems: ‘center’, padding: ‘20px 28px 16px’, flexWrap: ‘wrap’, gap: 16 },
logo:        { fontSize: 26, fontWeight: ‘bold’, letterSpacing: 1, color: ‘#f5c87a’ },
logoSub:     { fontSize: 11, color: ‘#c4a87a’, letterSpacing: 2, textTransform: ‘uppercase’, marginTop: 3 },
stats:       { display: ‘flex’, gap: 22, flexWrap: ‘wrap’ },
statBox:     { textAlign: ‘center’ },
statVal:     { fontSize: 22, fontWeight: ‘bold’, color: ‘#f5c87a’ },
statLabel:   { fontSize: 10, color: ‘#c4a87a’, textTransform: ‘uppercase’, letterSpacing: 1 },
nav:         { display: ‘flex’, padding: ‘0 20px’, borderTop: ‘1px solid rgba(255,255,255,0.1)’, overflowX: ‘auto’ },
navBtn:      { background: ‘none’, border: ‘none’, color: ‘#c4a87a’, padding: ‘13px 18px’, cursor: ‘pointer’, fontSize: 13, letterSpacing: 0.5, borderBottom: ‘3px solid transparent’, whiteSpace: ‘nowrap’ },
navActive:   { color: ‘#f5c87a’, borderBottom: ‘3px solid #f5c87a’, background: ‘rgba(245,200,122,0.07)’ },
main:        { maxWidth: 1100, margin: ‘0 auto’, padding: ‘28px 20px’ },
filterBar:   { display: ‘flex’, gap: 12, marginBottom: 24, flexWrap: ‘wrap’, alignItems: ‘center’ },
filterGroup: { display: ‘flex’, alignItems: ‘center’, gap: 6 },
filterLabel: { fontSize: 12, color: ‘#8a7560’, whiteSpace: ‘nowrap’ },
searchInput: { flex: 1, minWidth: 200, padding: ‘10px 16px’, border: ‘1.5px solid #ddd0bc’, borderRadius: 8, fontSize: 14, background: ‘#fff’, fontFamily: ‘inherit’, color: ‘#2d1f0e’, outline: ‘none’ },
refreshBtn:  { padding: ‘9px 14px’, border: ‘1.5px solid #ddd0bc’, borderRadius: 8, background: ‘#fff’, cursor: ‘pointer’, fontSize: 16, color: ‘#8a7560’ },
grid:        { display: ‘grid’, gridTemplateColumns: ‘repeat(auto-fill,minmax(295px,1fr))’, gap: 22 },
card:        { background: ‘#fff’, borderRadius: 12, overflow: ‘hidden’, boxShadow: ‘0 2px 12px rgba(45,31,14,0.09)’, cursor: ‘pointer’, border: ‘1px solid #ede4d8’ },
cardImg:     { width: ‘100%’, height: 200, objectFit: ‘cover’, display: ‘block’ },
badge:       { position: ‘absolute’, top: 12, right: 12, padding: ‘4px 10px’, borderRadius: 20, fontSize: 11, fontWeight: ‘bold’ },
typeBadge:   { position: ‘absolute’, top: 12, left: 12, padding: ‘4px 10px’, borderRadius: 20, fontSize: 11, background: ‘rgba(26,15,5,0.72)’, color: ‘#f5ead8’ },
cardBody:    { padding: ‘16px 18px’ },
cardPrice:   { fontSize: 21, fontWeight: ‘bold’, color: ‘#7a3d00’, marginBottom: 4 },
cardTitle:   { fontSize: 15, fontWeight: ‘bold’, marginBottom: 3 },
cardAddr:    { fontSize: 12, color: ‘#8a7560’, marginBottom: 10 },
cardMeta:    { display: ‘flex’, gap: 12, fontSize: 12, color: ‘#5a4a3a’, flexWrap: ‘wrap’ },
sectionTitle:{ fontSize: 21, fontWeight: ‘bold’, marginBottom: 20, borderBottom: ‘2px solid #f5c87a’, paddingBottom: 10 },
dbBadge:     { display: ‘inline-block’, background: ‘#e6f4ea’, color: ‘#1e6e3a’, fontSize: 12, padding: ‘5px 14px’, borderRadius: 20, marginBottom: 22, fontWeight: ‘bold’ },
buyerList:   { display: ‘flex’, flexDirection: ‘column’, gap: 14 },
buyerCard:   { background: ‘#fff’, borderRadius: 12, padding: ‘18px 20px’, display: ‘flex’, gap: 14, alignItems: ‘flex-start’, border: ‘1px solid #ede4d8’, boxShadow: ‘0 2px 8px rgba(45,31,14,0.06)’ },
buyerAvatar: { width: 46, height: 46, borderRadius: ‘50%’, background: ‘linear-gradient(135deg,#f5c87a,#7a3d00)’, display: ‘flex’, alignItems: ‘center’, justifyContent: ‘center’, fontSize: 18, color: ‘#fff’, fontWeight: ‘bold’, flexShrink: 0 },
buyerName:   { fontSize: 15, fontWeight: ‘bold’, marginBottom: 4 },
buyerDetail: { fontSize: 13, color: ‘#5a4a3a’, marginBottom: 3 },
buyerNotes:  { fontStyle: ‘italic’, color: ‘#8a7560’, fontSize: 13, marginTop: 6, borderLeft: ‘3px solid #f5c87a’, paddingLeft: 10 },
buyerDate:   { fontSize: 11, color: ‘#b0a090’, whiteSpace: ‘nowrap’ },
smallDeleteBtn: { background: ‘none’, border: ‘1px solid #fca5a5’, borderRadius: 6, padding: ‘4px 10px’, fontSize: 11, color: ‘#9b1c1c’, cursor: ‘pointer’, fontFamily: ‘inherit’ },
formWrap:    { background: ‘#fff’, borderRadius: 14, padding: 28, border: ‘1px solid #ede4d8’, maxWidth: 700, margin: ‘0 auto’, boxShadow: ‘0 2px 20px rgba(45,31,14,0.08)’ },
formGrid:    { display: ‘grid’, gridTemplateColumns: ‘1fr 1fr’, gap: ‘16px 20px’, marginBottom: 24 },
field:       { display: ‘flex’, flexDirection: ‘column’, gap: 6 },
label:       { fontSize: 11, fontWeight: ‘bold’, color: ‘#5a4a3a’, letterSpacing: 0.6, textTransform: ‘uppercase’ },
input:       { padding: ‘10px 14px’, border: ‘1.5px solid #ddd0bc’, borderRadius: 8, fontSize: 14, fontFamily: ‘inherit’, color: ‘#2d1f0e’, background: ‘#faf7f2’, outline: ‘none’ },
select:      { padding: ‘10px 14px’, border: ‘1.5px solid #ddd0bc’, borderRadius: 8, fontSize: 14, fontFamily: ‘inherit’, color: ‘#2d1f0e’, background: ‘#faf7f2’, outline: ‘none’ },
primaryBtn:  { background: ‘linear-gradient(135deg,#6b3d12,#f5c87a)’, color: ‘#fff’, border: ‘none’, padding: ‘14px 32px’, borderRadius: 8, fontSize: 15, fontWeight: ‘bold’, cursor: ‘pointer’, width: ‘100%’, fontFamily: ‘inherit’ },
overlay:     { position: ‘fixed’, inset: 0, background: ‘rgba(0,0,0,0.58)’, display: ‘flex’, alignItems: ‘center’, justifyContent: ‘center’, zIndex: 1000, padding: 20 },
modal:       { background: ‘#fff’, borderRadius: 16, overflow: ‘hidden’, maxWidth: 580, width: ‘100%’, maxHeight: ‘90vh’, overflowY: ‘auto’, boxShadow: ‘0 20px 60px rgba(0,0,0,0.3)’ },
modalImg:    { width: ‘100%’, height: 230, objectFit: ‘cover’ },
modalBody:   { padding: ‘22px 24px’ },
modalPrice:  { fontSize: 26, fontWeight: ‘bold’, color: ‘#7a3d00’ },
modalTitle:  { fontSize: 19, fontWeight: ‘bold’, marginBottom: 3 },
closeBtn:    { background: ‘none’, border: ‘1px solid #ddd’, borderRadius: ‘50%’, width: 32, height: 32, cursor: ‘pointer’, fontSize: 14, color: ‘#5a4a3a’, display: ‘flex’, alignItems: ‘center’, justifyContent: ‘center’, flexShrink: 0 },
statusBtn:   { padding: ‘7px 16px’, borderRadius: 20, border: ‘1.5px solid #ddd0bc’, background: ‘none’, cursor: ‘pointer’, fontSize: 12, color: ‘#5a4a3a’, fontFamily: ‘inherit’ },
statusBtnActive: { background: ‘#f5c87a’, borderColor: ‘#f5c87a’, color: ‘#1a0f05’, fontWeight: ‘bold’ },
deleteBtn:   { padding: ‘7px 14px’, borderRadius: 20, border: ‘1.5px solid #fca5a5’, background: ‘none’, cursor: ‘pointer’, fontSize: 12, color: ‘#9b1c1c’, fontFamily: ‘inherit’, marginLeft: ‘auto’ },
toast:       { position: ‘fixed’, bottom: 28, left: ‘50%’, transform: ‘translateX(-50%)’, background: ‘#1a0f05’, color: ‘#f5c87a’, padding: ‘12px 28px’, borderRadius: 30, fontSize: 14, fontWeight: ‘bold’, zIndex: 9999, boxShadow: ‘0 4px 20px rgba(0,0,0,0.35)’, whiteSpace: ‘nowrap’ },
emptyState:  { textAlign: ‘center’, padding: ‘60px 20px’, color: ‘#5a4a3a’ },
};
