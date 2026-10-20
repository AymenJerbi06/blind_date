/* Browser-only persistence adapter. Domain models never depend on localStorage.
   Photos are written once as separate assets, not re-serialized on every keystroke.
   The small state document is the commit point; failed commits keep the old assets. */
const LocalRepository = (() => {
  function create(storage, key) {
    const prefix = `${key}:photo:`;
    const assets = new Map();
    let committedRefs = new Set();
    let lastDocument = null;
    let sequence = 0;

    function read() {
      try {
        const document = storage.getItem(key);
        const raw = JSON.parse(document);
        assets.clear();
        committedRefs.clear();
        const expand = photos => {
          if (!Array.isArray(photos)) return [];
          return photos.map(value => {
            if (typeof value !== 'string') return null;
            if (!value.startsWith(prefix)) return value; // Legacy inline photos.
            committedRefs.add(value);
            const data = storage.getItem(value);
            if (data) assets.set(data, value);
            return data;
          }).filter(Boolean);
        };
        if (raw?.profile) raw.profile.photos = expand(raw.profile.photos);
        if (raw?.drafts?.profile?.draft) {
          raw.drafts.profile.draft.photos = expand(raw.drafts.profile.draft.photos);
        }
        lastDocument = document;
        return raw;
      } catch {
        return null;
      }
    }

    function write(state) {
      const nextRefs = new Set();
      const added = [];
      const compact = profile => {
        const photos = (profile.photos || []).map(data => {
          let ref = assets.get(data);
          if (!ref) {
            do {
              ref = `${prefix}${Date.now().toString(36)}-${++sequence}-${Math.random().toString(36).slice(2, 9)}`;
            } while (storage.getItem(ref) !== null && storage.getItem(ref) !== undefined);
            storage.setItem(ref, data);
            added.push([data, ref]);
            assets.set(data, ref);
          }
          nextRefs.add(ref);
          return ref;
        });
        return {...profile, photos};
      };
      try {
        const draft = state.drafts.profile;
        const document = JSON.stringify({
          ...state,
          profile: compact(state.profile),
          drafts: {
            ...state.drafts,
            profile: draft ? {...draft, draft: compact(draft.draft)} : null,
          },
        });
        if (document !== lastDocument) storage.setItem(key, document);
        lastDocument = document;
      } catch (error) {
        // Roll back only assets created by this failed write; older committed photos survive.
        for (const [data, ref] of added) {
          try { storage.removeItem(ref); } catch { /* Best-effort orphan cleanup. */ }
          assets.delete(data);
        }
        throw error;
      }
      // Reclaim removed photos only after the new document has committed successfully.
      for (const ref of committedRefs) {
        if (!nextRefs.has(ref)) {
          try { storage.removeItem(ref); } catch { /* Storage cleanup can be retried later. */ }
        }
      }
      for (const [data, ref] of assets) if (!nextRefs.has(ref)) assets.delete(data);
      committedRefs = nextRefs;
    }

    return {read, write};
  }
  return {create};
})();
