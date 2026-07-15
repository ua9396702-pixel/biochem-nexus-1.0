(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.StudentWorkspace = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const STORAGE_KEY = 'bionexus.student.workspace.v1';
  const AUTH_KEY = 'bionexus.student.auth.v1';
  const RECENT_KEY = 'bionexus.student.recent.v1';
  const DEFAULT_MODULES = [
    { id: 'dna', title: 'DNA Explorer', href: 'molecular-biology/dna-explorer.html', category: 'Molecular Biology' },
    { id: 'protein', title: 'Protein Explorer', href: 'biochemistry/protein-explorer.html', category: 'Biochemistry' },
    { id: 'pcr', title: 'PCR', href: 'laboratory/pcr.html', category: 'Laboratory' },
    { id: 'tool', title: 'Molecular Weight Calculator', href: 'tools/molecular-weight-calculator.html', category: 'Tools' }
  ];

  function createId(prefix) {
    return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDate(value) {
    if (!value) return 'Just now';
    const date = new Date(value);
    return date.toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function createEmptyStudentProfile(email, name) {
    return {
      user: {
        id: createId('user'),
        name: name || 'BioNexus Student',
        email: email || 'student@bionexus.edu',
        joinedAt: new Date().toISOString(),
        rememberMe: false
      },
      notes: [],
      folders: [{ id: createId('folder'), title: 'General', subjectId: null, createdAt: new Date().toISOString() }],
      subjects: [{ id: createId('subject'), title: 'Biology', createdAt: new Date().toISOString() }],
      bookmarks: [],
      planner: [],
      checklist: [],
      glossary: [],
      favorites: [],
      recentlyViewed: [],
      downloads: [],
      progress: {
        modulesCompleted: 0,
        topicsStudied: 0,
        savedNotes: 0,
        bookmarkedTopics: 0,
        revisionProgress: 0
      }
    };
  }

  function normalizeProfile(profile) {
    const base = createEmptyStudentProfile(profile?.user?.email || 'student@bionexus.edu', profile?.user?.name || 'BioNexus Student');
    const next = { ...base, ...profile, user: { ...base.user, ...(profile?.user || {}) } };
    next.notes = Array.isArray(profile?.notes) ? profile.notes : [];
    next.folders = Array.isArray(profile?.folders) && profile.folders.length ? profile.folders : base.folders;
    next.subjects = Array.isArray(profile?.subjects) && profile.subjects.length ? profile.subjects : base.subjects;
    next.bookmarks = Array.isArray(profile?.bookmarks) ? profile.bookmarks : [];
    next.planner = Array.isArray(profile?.planner) ? profile.planner : [];
    next.checklist = Array.isArray(profile?.checklist) ? profile.checklist : [];
    next.glossary = Array.isArray(profile?.glossary) ? profile.glossary : [];
    next.favorites = Array.isArray(profile?.favorites) ? profile.favorites : [];
    next.recentlyViewed = Array.isArray(profile?.recentlyViewed) ? profile.recentlyViewed : [];
    next.downloads = Array.isArray(profile?.downloads) ? profile.downloads : [];
    next.progress = { ...base.progress, ...(profile?.progress || {}) };
    return next;
  }

  function getStoredProfile() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const profile = createEmptyStudentProfile();
        saveStoredProfile(profile);
        return profile;
      }
      return normalizeProfile(JSON.parse(raw));
    } catch (error) {
      return createEmptyStudentProfile();
    }
  }

  function saveStoredProfile(profile) {
    const normalized = normalizeProfile(profile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  }

  function getStoredAuth() {
    try {
      return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
    } catch (error) {
      return null;
    }
  }

  function saveStoredAuth(value) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(value));
  }

  function clearStoredAuth() {
    localStorage.removeItem(AUTH_KEY);
  }

  function getRecentItems() {
    try {
      return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    } catch (error) {
      return [];
    }
  }

  function saveRecentItems(items) {
    localStorage.setItem(RECENT_KEY, JSON.stringify(items));
  }

  function getProgressSnapshot(profile) {
    const normalized = normalizeProfile(profile);
    const completedTasks = normalized.planner.filter((item) => item.completed).length;
    const totalTasks = normalized.planner.length;
    const revisionProgress = normalized.checklist.length ? Math.round((normalized.checklist.filter((item) => item.completed).length / normalized.checklist.length) * 100) : 0;
    return {
      modulesCompleted: normalized.progress.modulesCompleted || 0,
      topicsStudied: normalized.progress.topicsStudied || 0,
      savedNotes: normalized.notes.length,
      bookmarkedTopics: normalized.bookmarks.length,
      revisionProgress
    };
  }

  function ensureAuth(profile) {
    const auth = getStoredAuth();
    return Boolean(auth && auth.isAuthenticated && auth.email && profile?.user?.email === auth.email);
  }

  function createNote(profile, payload) {
    const note = {
      id: createId('note'),
      title: payload.title || 'Untitled note',
      body: payload.body || '<p>Start typing here...</p>',
      folderId: payload.folderId || profile.folders[0]?.id || null,
      subjectId: payload.subjectId || null,
      tags: payload.tags || [],
      pinned: Boolean(payload.pinned),
      favorite: Boolean(payload.favorite),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDraft: Boolean(payload.isDraft)
    };
    profile.notes.unshift(note);
    profile.progress.savedNotes = profile.notes.length;
    return note;
  }

  function exportNoteText(note) {
    const plainText = String(note?.body || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return `# ${note?.title || 'Untitled note'}\n\n${plainText}`;
  }

  function importNotesFromText(text, profile, payload = {}) {
    const parsed = String(text || '').split(/\n{2,}/).filter(Boolean);
    if (!parsed.length) return [];
    const imported = parsed.map((entry, index) => {
      const lines = entry.split('\n').filter(Boolean);
      const title = payload.title ? `${payload.title} ${index + 1}` : (lines[0] || `Imported note ${index + 1}`).replace(/^#\s*/, '').trim();
      const body = lines.slice(1).join('\n').trim() || lines[0].replace(/^#\s*/, '').trim();
      return createNote(profile, {
        title,
        body: `<p>${(body || 'Imported note').replace(/\n/g, '</p><p>')}</p>`,
        folderId: payload.folderId || profile.folders[0]?.id || null,
        subjectId: payload.subjectId || null,
        pinned: Boolean(payload.pinned),
        favorite: Boolean(payload.favorite)
      });
    });
    return imported;
  }

  function duplicateNote(profile, noteId) {
    const source = profile.notes.find((note) => note.id === noteId);
    if (!source) return null;
    const duplicate = { ...source, id: createId('note'), title: `${source.title} (copy)`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    profile.notes.unshift(duplicate);
    profile.progress.savedNotes = profile.notes.length;
    return duplicate;
  }

  function addBookmark(profile, resource) {
    const exists = profile.bookmarks.some((item) => item.id === resource.id);
    if (exists) return profile.bookmarks;
    const bookmark = { ...resource, id: createId('bookmark'), createdAt: new Date().toISOString() };
    profile.bookmarks.unshift(bookmark);
    profile.progress.bookmarkedTopics = profile.bookmarks.length;
    return profile.bookmarks;
  }

  function addPlannerTask(profile, payload) {
    const item = {
      id: createId('planner'),
      title: payload.title || 'New task',
      dueDate: payload.dueDate || '',
      subject: payload.subject || 'General',
      completed: false,
      createdAt: new Date().toISOString()
    };
    profile.planner.unshift(item);
    return item;
  }

  function addChecklistItem(profile, payload) {
    const item = {
      id: createId('checklist'),
      title: payload.title || 'New revision point',
      completed: false,
      createdAt: new Date().toISOString()
    };
    profile.checklist.unshift(item);
    return item;
  }

  function addGlossaryEntry(profile, payload) {
    const entry = {
      id: createId('glossary'),
      term: payload.term || 'New term',
      definition: payload.definition || 'Add a simple explanation.',
      createdAt: new Date().toISOString()
    };
    profile.glossary.unshift(entry);
    return entry;
  }

  function createFolder(profile, title) {
    if (!title) return null;
    const folder = { id: createId('folder'), title, subjectId: null, createdAt: new Date().toISOString() };
    profile.folders.unshift(folder);
    return folder;
  }

  function renameFolder(profile, folderId, title) {
    const folder = profile.folders.find((item) => item.id === folderId);
    if (!folder || !title) return null;
    folder.title = title;
    return folder;
  }

  function createSubject(profile, title) {
    if (!title) return null;
    const subject = { id: createId('subject'), title, createdAt: new Date().toISOString() };
    profile.subjects.unshift(subject);
    return subject;
  }

  function toggleFavorite(profile, resourceId) {
    const exists = profile.favorites.includes(resourceId);
    if (exists) {
      profile.favorites = profile.favorites.filter((item) => item !== resourceId);
    } else {
      profile.favorites.push(resourceId);
    }
    return profile.favorites;
  }

  function persistRecentVisit(pageTitle, href) {
    const profile = getStoredProfile();
    const item = { id: createId('recent'), title: pageTitle || 'BioNexus page', href: href || '#', viewedAt: new Date().toISOString() };
    const recent = [item, ...(profile.recentlyViewed || []).filter((entry) => entry.href !== item.href)].slice(0, 8);
    profile.recentlyViewed = recent;
    profile.progress.topicsStudied = profile.recentlyViewed.length;
    saveStoredProfile(profile);
    return recent;
  }

  function renderStudyNotesPage(context) {
    const profile = getStoredProfile();
    const auth = ensureAuth(profile);
    const progress = getProgressSnapshot(profile);
    const state = window.StudentWorkspace._state || {};
    const notes = (profile.notes || []).filter((note) => {
      const search = (state.noteSearch || '').toLowerCase();
      if (search && !(`${note.title} ${note.body}`.toLowerCase()).includes(search)) return false;
      if (state.noteFilter === 'pinned') return note.pinned;
      if (state.noteFilter === 'favorites') return note.favorite;
      if (state.noteFilter === 'folder' && state.activeFolderId) return note.folderId === state.activeFolderId;
      return true;
    });
    const selectedNote = profile.notes.find((note) => note.id === state.selectedNoteId) || notes[0] || null;
    const folderOptions = (profile.folders || []).map((folder) => `<option value="${folder.id}" ${state.noteFolderId === folder.id ? 'selected' : ''}>${escapeHtml(folder.title)}</option>`).join('');
    const subjectOptions = (profile.subjects || []).map((subject) => `<option value="${subject.id}" ${state.noteSubjectId === subject.id ? 'selected' : ''}>${escapeHtml(subject.title)}</option>`).join('');
    const bookmarkedResources = (profile.bookmarks || []).slice(0, 6);
    const recentItems = (profile.recentlyViewed || []).slice(0, 6);
    const favoriteModules = DEFAULT_MODULES.filter((module) => profile.favorites.includes(module.id));
    const activeModuleCards = DEFAULT_MODULES.map((module) => `
      <div class="study-card compact">
        <div>
          <strong>${escapeHtml(module.title)}</strong>
          <p class="muted">${escapeHtml(module.category)}</p>
        </div>
        <button class="btn btn-secondary small" data-action="toggle-favorite" data-module-id="${module.id}">${profile.favorites.includes(module.id) ? '★ Saved' : '☆ Save'}</button>
      </div>
    `).join('');
    const plannerItems = (profile.planner || []).slice(0, 6).map((item) => `
      <div class="study-card compact">
        <label class="check-row">
          <input type="checkbox" data-action="toggle-planner" data-item-id="${item.id}" ${item.completed ? 'checked' : ''}>
          <span>${escapeHtml(item.title)} <small>${escapeHtml(item.subject || 'General')} • ${escapeHtml(item.dueDate || 'No deadline')}</small></span>
        </label>
      </div>
    `).join('');
    const checklistItems = (profile.checklist || []).slice(0, 6).map((item) => `
      <div class="study-card compact">
        <label class="check-row">
          <input type="checkbox" data-action="toggle-checklist" data-item-id="${item.id}" ${item.completed ? 'checked' : ''}>
          <span>${escapeHtml(item.title)}</span>
        </label>
      </div>
    `).join('');
    const glossaryEntries = (profile.glossary || []).slice(0, 8).map((entry) => `
      <div class="study-card compact">
        <strong>${escapeHtml(entry.term)}</strong>
        <p class="muted">${escapeHtml(entry.definition)}</p>
      </div>
    `).join('');
    const noteList = notes.length ? notes.map((note) => `
      <button class="note-item ${selectedNote?.id === note.id ? 'active' : ''}" type="button" data-action="select-note" data-note-id="${note.id}">
        <div class="note-item-row">
          <strong>${escapeHtml(note.title)}</strong>
          ${note.pinned ? '<span class="pill">Pinned</span>' : ''}
          ${note.favorite ? '<span class="pill">Favorite</span>' : ''}
        </div>
        <p class="muted">${escapeHtml(note.body.replace(/<[^>]+>/g, '').slice(0, 58)) || 'No preview yet'}</p>
        <span class="muted small">${formatDate(note.updatedAt)}</span>
      </button>
    `).join('') : '<div class="empty-state"><p>No notes yet. Create your first one to begin building your personal study library.</p></div>';
    const authBanner = auth ? '<div class="workspace-pill success">Signed in as ' + escapeHtml(profile.user.name) + '</div>' : '<div class="workspace-pill">Guest access • unlock personal features with a free account</div>';
    const viewMarkup = {
      notes: `
        <div class="workspace-main-grid">
          <div class="card workspace-panel notes-list-panel">
            <div class="workspace-panel-head">
              <div>
                <h3>My Notes</h3>
                <p class="muted">Organize your ideas, revise concepts, and export your learning as you go.</p>
              </div>
              <button class="btn btn-primary small" type="button" data-action="create-note">+ New note</button>
            </div>
            <div class="workspace-toolbar">
              <input class="workspace-input" type="search" placeholder="Search notes" data-action="search-notes" value="${escapeHtml(state.noteSearch || '')}">
              <select class="workspace-input" data-action="filter-notes">
                <option value="all" ${state.noteFilter === 'all' ? 'selected' : ''}>All notes</option>
                <option value="pinned" ${state.noteFilter === 'pinned' ? 'selected' : ''}>Pinned</option>
                <option value="favorites" ${state.noteFilter === 'favorites' ? 'selected' : ''}>Favorites</option>
                <option value="folder" ${state.noteFilter === 'folder' ? 'selected' : ''}>Folder</option>
              </select>
            </div>
            <div class="workspace-toolbar compact">
              <input class="workspace-input" type="text" data-action="folder-title" placeholder="New folder name">
              <button class="btn btn-secondary small" type="button" data-action="create-folder">Create folder</button>
              <input class="workspace-input" type="text" data-action="subject-title" placeholder="New subject">
              <button class="btn btn-secondary small" type="button" data-action="create-subject">Create subject</button>
              <button class="btn btn-secondary small" type="button" data-action="rename-selected-folder">Rename folder</button>
            </div>
            <div class="workspace-pill-row">
              <button class="pill-button" type="button" data-action="set-folder-filter" data-folder-id="all">All folders</button>
              ${(profile.folders || []).map((folder) => `<button class="pill-button ${state.activeFolderId === folder.id ? 'active' : ''}" type="button" data-action="set-folder-filter" data-folder-id="${folder.id}">${escapeHtml(folder.title)}</button>`).join('')}
            </div>
            <div class="notes-list">${noteList}</div>
          </div>
          <div class="card workspace-panel editor-panel">
            ${selectedNote ? `
              <div class="workspace-panel-head">
                <div>
                  <h3>${escapeHtml(selectedNote.title)}</h3>
                  <p class="muted">Updated ${formatDate(selectedNote.updatedAt)}</p>
                </div>
                <div class="workspace-inline-actions">
                  <button class="btn btn-secondary small" type="button" data-action="duplicate-note" data-note-id="${selectedNote.id}">Duplicate</button>
                  <button class="btn btn-secondary small" type="button" data-action="delete-note" data-note-id="${selectedNote.id}">Delete</button>
                  <button class="btn btn-secondary small" type="button" data-action="toggle-note-pin" data-note-id="${selectedNote.id}">${selectedNote.pinned ? 'Unpin' : 'Pin'}</button>
                  <button class="btn btn-secondary small" type="button" data-action="toggle-note-favorite" data-note-id="${selectedNote.id}">${selectedNote.favorite ? '★ Favorite' : '☆ Favorite'}</button>
                </div>
              </div>
              <div class="workspace-toolbar compact">
                <label class="field-label">Title<input class="workspace-input" type="text" data-action="update-note-title" data-note-id="${selectedNote.id}" value="${escapeHtml(selectedNote.title)}"></label>
                <label class="field-label">Folder<select class="workspace-input" data-action="update-note-folder" data-note-id="${selectedNote.id}">${folderOptions}</select></label>
                <label class="field-label">Subject<select class="workspace-input" data-action="update-note-subject" data-note-id="${selectedNote.id}">${subjectOptions}</select></label>
                <label class="field-label">Tags<input class="workspace-input" type="text" data-action="update-note-tags" data-note-id="${selectedNote.id}" value="${escapeHtml((selectedNote.tags || []).join(', '))}"></label>
              </div>
              <div class="workspace-toolbar compact">
                <button class="pill-button" type="button" data-action="export-markdown" data-note-id="${selectedNote.id}">Export .md</button>
                <button class="pill-button" type="button" data-action="export-pdf" data-note-id="${selectedNote.id}">Export PDF</button>
                <button class="pill-button" type="button" data-action="import-note-text">Import notes</button>
                <label class="field-label" style="min-width:240px"><span>Import .txt</span><input class="workspace-input" type="file" accept=".txt,.md" data-action="import-file" data-note-id="${selectedNote.id}"></label>
              </div>
              <div class="workspace-editor-toolbar">
                <button class="pill-button" type="button" data-action="editor-command" data-command="bold"><strong>B</strong></button>
                <button class="pill-button" type="button" data-action="editor-command" data-command="italic"><em>I</em></button>
                <button class="pill-button" type="button" data-action="editor-command" data-command="underline"><u>U</u></button>
                <button class="pill-button" type="button" data-action="editor-command" data-command="insertUnorderedList">• List</button>
                <button class="pill-button" type="button" data-action="editor-command" data-command="insertOrderedList">1. List</button>
                <button class="pill-button" type="button" data-action="editor-command" data-command="formatBlock" data-value="h3">H3</button>
                <button class="pill-button" type="button" data-action="editor-command" data-command="createLink">Link</button>
                <button class="pill-button" type="button" data-action="editor-command" data-command="insertHTML" data-value="<ul><li>Checklist item</li></ul>">Checklist</button>
                <button class="pill-button" type="button" data-action="editor-command" data-command="insertHTML" data-value="<table><tr><td>Header</td><td>Header</td></tr><tr><td>Row</td><td>Value</td></tr></table>">Table</button>
                <button class="pill-button" type="button" data-action="editor-command" data-command="hiliteColor">Highlight</button>
                <button class="pill-button" type="button" data-action="export-markdown" data-note-id="${selectedNote.id}">Export .md</button>
                <button class="pill-button" type="button" data-action="export-pdf" data-note-id="${selectedNote.id}">Export PDF</button>
                <button class="pill-button" type="button" data-action="print-note" data-note-id="${selectedNote.id}">Print</button>
              </div>
              <div class="workspace-editor" contenteditable="true" data-role="note-editor" data-note-id="${selectedNote.id}">${selectedNote.body}</div>
            ` : '<div class="empty-state"><p>Create a note to start building your revision library.</p></div>'}
          </div>
        </div>
      `,
      bookmarks: `
        <div class="workspace-main-grid single-column">
          <div class="card workspace-panel">
            <div class="workspace-panel-head">
              <div>
                <h3>Bookmarks</h3>
                <p class="muted">Keep the modules and tools you want to revisit close at hand.</p>
              </div>
              <button class="btn btn-primary small" type="button" data-action="add-bookmark">+ Bookmark a module</button>
            </div>
            <div class="workspace-toolbar">
              <select class="workspace-input" data-action="bookmark-select">
                ${DEFAULT_MODULES.map((module) => `<option value="${module.id}">${escapeHtml(module.title)}</option>`).join('')}
              </select>
            </div>
            <div class="study-grid two-up">
              ${(profile.bookmarks || []).length ? bookmarkedResources.map((item) => `
                <div class="study-card">
                  <strong>${escapeHtml(item.title)}</strong>
                  <p class="muted">${escapeHtml(item.category || 'Saved from BioNexus')}</p>
                  <div class="workspace-pill-row">
                    <span class="pill">${escapeHtml(item.href || 'workspace')}</span>
                    <button class="pill-button small" type="button" data-action="remove-bookmark" data-bookmark-id="${item.id}">Remove</button>
                  </div>
                </div>
              `).join('') : '<div class="empty-state"><p>Your bookmarks will appear here once you save a module or tool.</p></div>'}
            </div>
          </div>
        </div>
      `,
      planner: `
        <div class="workspace-main-grid single-column">
          <div class="card workspace-panel">
            <div class="workspace-panel-head">
              <div>
                <h3>Study Planner</h3>
                <p class="muted">Build focused study sessions and track deadlines without losing momentum.</p>
              </div>
              <button class="btn btn-primary small" type="button" data-action="create-planner">+ Add task</button>
            </div>
            <div class="workspace-toolbar compact">
              <input class="workspace-input" type="text" data-action="planner-title" placeholder="Task title">
              <input class="workspace-input" type="date" data-action="planner-date">
              <input class="workspace-input" type="text" data-action="planner-subject" placeholder="Subject">
            </div>
            <div class="study-grid two-up">${plannerItems || '<div class="empty-state"><p>Use this planner to map upcoming study blocks and assignments.</p></div>'}</div>
          </div>
        </div>
      `,
      checklist: `
        <div class="workspace-main-grid single-column">
          <div class="card workspace-panel">
            <div class="workspace-panel-head">
              <div>
                <h3>Revision Checklist</h3>
                <p class="muted">Track the key ideas you want to review before an exam.</p>
              </div>
              <button class="btn btn-primary small" type="button" data-action="create-checklist">+ Add item</button>
            </div>
            <div class="workspace-toolbar compact">
              <input class="workspace-input" type="text" data-action="checklist-title" placeholder="Revision checklist item">
            </div>
            <div class="study-grid two-up">${checklistItems || '<div class="empty-state"><p>Set a checklist for each topic and watch your revision progress grow.</p></div>'}</div>
          </div>
        </div>
      `,
      favorites: `
        <div class="workspace-main-grid single-column">
          <div class="card workspace-panel">
            <div class="workspace-panel-head">
              <div>
                <h3>Favorite Topics</h3>
                <p class="muted">Bookmark the concepts you want to revisit fast.</p>
              </div>
            </div>
            <div class="study-grid two-up">${activeModuleCards}</div>
          </div>
        </div>
      `,
      recent: `
        <div class="workspace-main-grid single-column">
          <div class="card workspace-panel">
            <div class="workspace-panel-head">
              <div>
                <h3>Recently Viewed</h3>
                <p class="muted">Jump back into the modules and pages you explored last.</p>
              </div>
            </div>
            <div class="study-grid two-up">${recentItems.length ? recentItems.map((item) => `
              <div class="study-card">
                <strong>${escapeHtml(item.title)}</strong>
                <p class="muted">${escapeHtml(item.href || 'BioNexus page')}</p>
                <a class="pill-button" href="${escapeHtml(item.href)}">Open</a>
              </div>
            `).join('') : '<div class="empty-state"><p>Your recent modules will appear here as you explore BioNexus.</p></div>'}</div>
          </div>
        </div>
      `,
      downloads: `
        <div class="workspace-main-grid single-column">
          <div class="card workspace-panel">
            <div class="workspace-panel-head">
              <div>
                <h3>Downloads</h3>
                <p class="muted">Export your study notes for offline revision and sharing.</p>
              </div>
            </div>
            <div class="study-grid two-up">${(profile.notes || []).length ? (profile.notes || []).slice(0, 8).map((note) => `
              <div class="study-card">
                <strong>${escapeHtml(note.title)}</strong>
                <p class="muted">${formatDate(note.updatedAt)}</p>
                <div class="workspace-pill-row">
                  <button class="pill-button small" type="button" data-action="export-markdown" data-note-id="${note.id}">Markdown</button>
                  <button class="pill-button small" type="button" data-action="export-pdf" data-note-id="${note.id}">PDF</button>
                </div>
              </div>
            `).join('') : '<div class="empty-state"><p>No downloadable notes yet. Create a note to prepare revision files.</p></div>'}</div>
          </div>
        </div>
      `,
      glossary: `
        <div class="workspace-main-grid single-column">
          <div class="card workspace-panel">
            <div class="workspace-panel-head">
              <div>
                <h3>Personal Glossary</h3>
                <p class="muted">Capture terms and your own explanations for quick revision.</p>
              </div>
              <button class="btn btn-primary small" type="button" data-action="create-glossary">+ Add term</button>
            </div>
            <div class="workspace-toolbar compact">
              <input class="workspace-input" type="text" data-action="glossary-term" placeholder="Term">
              <input class="workspace-input" type="text" data-action="glossary-definition" placeholder="Your explanation">
            </div>
            <div class="study-grid two-up">${glossaryEntries || '<div class="empty-state"><p>Build a glossary that matches your own study style.</p></div>'}</div>
          </div>
        </div>
      `,
      progress: `
        <div class="workspace-main-grid single-column">
          <div class="card workspace-panel">
            <div class="workspace-panel-head">
              <div>
                <h3>Learning Progress Dashboard</h3>
                <p class="muted">A clear overview of your current momentum across notes, bookmarks, and revision.</p>
              </div>
            </div>
            <div class="progress-grid">
              <div class="progress-card"><strong>${progress.modulesCompleted}</strong><span>Modules completed</span></div>
              <div class="progress-card"><strong>${progress.topicsStudied}</strong><span>Topics studied</span></div>
              <div class="progress-card"><strong>${progress.savedNotes}</strong><span>Saved notes</span></div>
              <div class="progress-card"><strong>${progress.bookmarkedTopics}</strong><span>Bookmarked topics</span></div>
            </div>
            <div class="workspace-separator"></div>
            <div class="progress-meter">
              <div class="meter-row"><span>Revision progress</span><strong>${progress.revisionProgress}%</strong></div>
              <div class="meter-track"><span style="width:${progress.revisionProgress}%"></span></div>
            </div>
            <div class="study-grid two-up">
              ${plannerItems || '<div class="empty-state"><p>Progress will begin to appear as you use the planner and checklist.</p></div>'}
            </div>
          </div>
        </div>
      `
    };
    return `
      <section class="student-workspace-section">
        <div class="workspace-hero card">
          <div>
            <span class="eyebrow">Student Workspace</span>
            <h2>${escapeHtml(context.title || 'Student Workspace')}</h2>
            <p class="muted">${escapeHtml(context.intro || 'Build your personal study environment with notes, bookmarks, planning tools, and progress tracking.')}</p>
          </div>
          <div class="workspace-hero-actions">
            ${auth ? `<div class="workspace-pill success">Signed in · ${escapeHtml(profile.user.email)}</div>` : `<button class="btn btn-primary small" type="button" data-action="open-auth">Create free account</button>`}
            ${auth ? `<button class="btn btn-secondary small" type="button" data-action="logout">Logout</button>` : `<button class="btn btn-secondary small" type="button" data-action="open-auth">Sign in</button>`}
          </div>
        </div>
        <div class="workspace-grid">
          <aside class="workspace-sidebar">
            <div class="card workspace-card">
              <h3>${auth ? 'Profile' : 'Unlock your workspace'}</h3>
              <p class="muted">${auth ? `Your personal learning space is ready for ${escapeHtml(profile.user.name)}.` : 'Create an account to save notes, bookmark topics, and track study progress.'}</p>
              ${authBanner}
              ${auth ? `<div class="workspace-pill-row"><span class="workspace-pill">${escapeHtml(profile.user.email)}</span><span class="workspace-pill">Joined ${formatDate(profile.user.joinedAt)}</span></div>` : ''}
            </div>
            <div class="card workspace-card">
              <h3>Workspace tools</h3>
              <div class="workspace-nav">
                ${['notes','bookmarks','planner','checklist','favorites','recent','downloads','glossary','progress'].map((key) => `<button class="workspace-nav-btn ${state.currentView === key ? 'active' : ''}" type="button" data-action="set-view" data-view="${key}">${escapeHtml(key === 'notes' ? 'My Notes' : key === 'bookmarks' ? 'Bookmarks' : key === 'planner' ? 'Study Planner' : key === 'checklist' ? 'Revision Checklist' : key === 'favorites' ? 'Favorite Topics' : key === 'recent' ? 'Recently Viewed' : key === 'downloads' ? 'Downloads' : key === 'glossary' ? 'Personal Glossary' : 'Learning Progress')}</button>`).join('')}
              </div>
            </div>
            <div class="card workspace-card">
              <h3>Quick actions</h3>
              <div class="workspace-pill-row">
                <button class="pill-button" type="button" data-action="create-note">Create note</button>
                <button class="pill-button" type="button" data-action="add-bookmark">Save module</button>
                <button class="pill-button" type="button" data-action="open-auth">Account</button>
              </div>
            </div>
          </aside>
          <div class="workspace-main">
            <div class="card workspace-metrics">
              <div class="metric-card"><strong>${progress.savedNotes}</strong><span>Saved notes</span></div>
              <div class="metric-card"><strong>${progress.bookmarkedTopics}</strong><span>Bookmarks</span></div>
              <div class="metric-card"><strong>${progress.revisionProgress}%</strong><span>Revision</span></div>
              <div class="metric-card"><strong>${profile.recentlyViewed.length}</strong><span>Recent views</span></div>
            </div>
            ${viewMarkup[state.currentView || 'notes'] || viewMarkup.notes}
          </div>
        </div>
        <div class="workspace-modal ${state.authModal ? 'open' : ''}" data-role="auth-modal">
          <div class="workspace-modal-card">
            <button class="modal-close" type="button" data-action="close-auth">×</button>
            <div class="workspace-modal-head">
              <h3>${state.authModal?.mode === 'forgot' ? 'Reset password' : state.authModal?.mode === 'signup' ? 'Create your free account' : 'Unlock your workspace'}</h3>
              <p class="muted">${state.authModal?.message || 'Create an account to save notes, bookmark topics, and keep your study journey organized.'}</p>
            </div>
            <div class="workspace-pill-row">
              <button class="pill-button ${state.authModal?.mode === 'login' ? 'active' : ''}" type="button" data-action="set-auth-mode" data-mode="login">Sign in</button>
              <button class="pill-button ${state.authModal?.mode === 'signup' ? 'active' : ''}" type="button" data-action="set-auth-mode" data-mode="signup">Sign up</button>
              <button class="pill-button ${state.authModal?.mode === 'forgot' ? 'active' : ''}" type="button" data-action="set-auth-mode" data-mode="forgot">Forgot password</button>
            </div>
            <form class="workspace-auth-form" data-role="auth-form">
              ${(state.authModal?.mode === 'signup' || state.authModal?.mode === 'login') ? `<label class="field-label">Name<input class="workspace-input" name="name" placeholder="Your name"></label>` : ''}
              <label class="field-label">Email<input class="workspace-input" name="email" type="email" placeholder="you@example.com" required></label>
              ${(state.authModal?.mode === 'signup' || state.authModal?.mode === 'login') ? `<label class="field-label">Password<input class="workspace-input" name="password" type="password" placeholder="Choose a password" required></label>` : ''}
              ${(state.authModal?.mode === 'signup') ? `<label class="field-label checkbox-label"><input type="checkbox" name="remember" value="true"> Remember me for future visits</label>` : ''}
              <div class="workspace-pill-row">
                <button class="btn btn-primary small" type="submit">${state.authModal?.mode === 'signup' ? 'Create account' : state.authModal?.mode === 'forgot' ? 'Send reset link' : 'Sign in'}</button>
                <button class="btn btn-secondary small" type="button" data-action="close-auth">Continue browsing</button>
              </div>
            </form>
          </div>
        </div>
      </section>
    `;
  }

  function initStudyNotesPage(context) {
    const state = window.StudentWorkspace._state || (window.StudentWorkspace._state = {
      currentView: 'notes',
      noteSearch: '',
      noteFilter: 'all',
      activeFolderId: 'all',
      noteFolderId: '',
      noteSubjectId: '',
      selectedNoteId: null,
      authModal: null
    });
    state.context = context;
    const rootEl = document.getElementById('student-workspace-root');
    if (!rootEl) return;
    function render() {
      rootEl.innerHTML = renderStudyNotesPage(context);
      const editor = rootEl.querySelector('[data-role="note-editor"]');
      if (editor) {
        editor.addEventListener('input', function () {
          const profile = getStoredProfile();
          const note = profile.notes.find((item) => item.id === state.selectedNoteId);
          if (note) {
            note.body = editor.innerHTML;
            note.updatedAt = new Date().toISOString();
            saveStoredProfile(profile);
          }
        });
      }
    }

    rootEl.addEventListener('click', function (event) {
      const action = event.target.closest('[data-action]');
      if (!action) return;
      const { action: name, view, mode, noteId, moduleId, folderId, bookmarkId, itemId, command, value } = action.dataset;
      const profile = getStoredProfile();
      if (name === 'set-view') {
        state.currentView = view;
        if (view === 'notes' && !state.selectedNoteId && profile.notes.length) state.selectedNoteId = profile.notes[0].id;
        render();
        return;
      }
      if (name === 'open-auth') {
        state.authModal = { mode: mode || 'signup', message: 'Create a free account to save notes, bookmark topics, and track your study progress.' };
        render();
        return;
      }
      if (name === 'close-auth') {
        state.authModal = null;
        render();
        return;
      }
      if (name === 'set-auth-mode') {
        state.authModal = { mode, message: 'Create a free account to save notes, bookmark topics, and track your study progress.' };
        render();
        return;
      }
      if (name === 'logout') {
        clearStoredAuth();
        state.authModal = null;
        render();
        return;
      }
      if (!authHelper(profile)) {
        state.authModal = { mode: 'signup', message: 'Create a free account to save notes, bookmark topics, and keep your workspace in sync.' };
        render();
        return;
      }
      if (name === 'create-note') {
        const note = createNote(profile, { title: 'New note', body: '<p>Start writing here...</p>', folderId: state.activeFolderId === 'all' ? profile.folders[0]?.id : state.activeFolderId });
        state.selectedNoteId = note.id;
        saveStoredProfile(profile);
        render();
        return;
      }
      if (name === 'create-folder') {
        const title = rootEl.querySelector('[data-action="folder-title"]').value.trim();
        if (!title) return;
        createFolder(profile, title);
        saveStoredProfile(profile);
        render();
        return;
      }
      if (name === 'create-subject') {
        const title = rootEl.querySelector('[data-action="subject-title"]').value.trim();
        if (!title) return;
        createSubject(profile, title);
        saveStoredProfile(profile);
        render();
        return;
      }
      if (name === 'rename-selected-folder') {
        const folderId = state.activeFolderId === 'all' ? profile.folders[0]?.id : state.activeFolderId;
        const folder = profile.folders.find((item) => item.id === folderId);
        const nextTitle = window.prompt('Rename folder', folder?.title || '');
        if (!nextTitle) return;
        renameFolder(profile, folderId, nextTitle.trim());
        saveStoredProfile(profile);
        render();
        return;
      }
      if (name === 'select-note') {
        state.selectedNoteId = noteId;
        render();
        return;
      }
      if (name === 'update-note-title') {
        const note = profile.notes.find((item) => item.id === noteId);
        if (note) {
          note.title = event.target.value;
          note.updatedAt = new Date().toISOString();
          saveStoredProfile(profile);
          render();
        }
        return;
      }
      if (name === 'update-note-folder') {
        const note = profile.notes.find((item) => item.id === noteId);
        if (note) {
          note.folderId = event.target.value;
          note.updatedAt = new Date().toISOString();
          saveStoredProfile(profile);
          render();
        }
        return;
      }
      if (name === 'update-note-subject') {
        const note = profile.notes.find((item) => item.id === noteId);
        if (note) {
          note.subjectId = event.target.value;
          note.updatedAt = new Date().toISOString();
          saveStoredProfile(profile);
          render();
        }
        return;
      }
      if (name === 'update-note-tags') {
        const note = profile.notes.find((item) => item.id === noteId);
        if (note) {
          note.tags = event.target.value.split(',').map((token) => token.trim()).filter(Boolean);
          note.updatedAt = new Date().toISOString();
          saveStoredProfile(profile);
          render();
        }
        return;
      }
      if (name === 'toggle-note-pin') {
        const note = profile.notes.find((item) => item.id === noteId);
        if (note) {
          note.pinned = !note.pinned;
          note.updatedAt = new Date().toISOString();
          saveStoredProfile(profile);
          render();
        }
        return;
      }
      if (name === 'toggle-note-favorite') {
        const note = profile.notes.find((item) => item.id === noteId);
        if (note) {
          note.favorite = !note.favorite;
          note.updatedAt = new Date().toISOString();
          saveStoredProfile(profile);
          render();
        }
        return;
      }
      if (name === 'duplicate-note') {
        duplicateNote(profile, noteId);
        saveStoredProfile(profile);
        render();
        return;
      }
      if (name === 'delete-note') {
        profile.notes = profile.notes.filter((item) => item.id !== noteId);
        profile.progress.savedNotes = profile.notes.length;
        saveStoredProfile(profile);
        render();
        return;
      }
      if (name === 'search-notes') {
        state.noteSearch = event.target.value;
        render();
        return;
      }
      if (name === 'filter-notes') {
        state.noteFilter = event.target.value;
        render();
        return;
      }
      if (name === 'set-folder-filter') {
        state.activeFolderId = folderId === 'all' ? 'all' : folderId;
        state.noteFilter = 'folder';
        render();
        return;
      }
      if (name === 'add-bookmark') {
        const moduleItem = DEFAULT_MODULES.find((item) => item.id === rootEl.querySelector('[data-action="bookmark-select"]').value);
        addBookmark(profile, { title: moduleItem.title, href: moduleItem.href, category: moduleItem.category });
        saveStoredProfile(profile);
        render();
        return;
      }
      if (name === 'remove-bookmark') {
        profile.bookmarks = profile.bookmarks.filter((item) => item.id !== bookmarkId);
        profile.progress.bookmarkedTopics = profile.bookmarks.length;
        saveStoredProfile(profile);
        render();
        return;
      }
      if (name === 'create-planner') {
        const title = rootEl.querySelector('[data-action="planner-title"]').value.trim();
        const dueDate = rootEl.querySelector('[data-action="planner-date"]').value;
        const subject = rootEl.querySelector('[data-action="planner-subject"]').value.trim();
        if (!title) return;
        addPlannerTask(profile, { title, dueDate, subject });
        saveStoredProfile(profile);
        render();
        return;
      }
      if (name === 'toggle-planner') {
        const plannerItem = profile.planner.find((item) => item.id === itemId);
        if (plannerItem) {
          plannerItem.completed = !plannerItem.completed;
          saveStoredProfile(profile);
          render();
        }
        return;
      }
      if (name === 'create-checklist') {
        const title = rootEl.querySelector('[data-action="checklist-title"]').value.trim();
        if (!title) return;
        addChecklistItem(profile, { title });
        saveStoredProfile(profile);
        render();
        return;
      }
      if (name === 'toggle-checklist') {
        const checklistItem = profile.checklist.find((item) => item.id === itemId);
        if (checklistItem) {
          checklistItem.completed = !checklistItem.completed;
          saveStoredProfile(profile);
          render();
        }
        return;
      }
      if (name === 'toggle-favorite') {
        toggleFavorite(profile, moduleId);
        saveStoredProfile(profile);
        render();
        return;
      }
      if (name === 'create-glossary') {
        const term = rootEl.querySelector('[data-action="glossary-term"]').value.trim();
        const definition = rootEl.querySelector('[data-action="glossary-definition"]').value.trim();
        if (!term || !definition) return;
        addGlossaryEntry(profile, { term, definition });
        saveStoredProfile(profile);
        render();
        return;
      }
      if (name === 'export-markdown') {
        const note = profile.notes.find((item) => item.id === noteId);
        if (note) {
          const blob = new Blob([exportNoteText(note)], { type: 'text/markdown;charset=utf-8' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `${note.title.toLowerCase().replace(/\s+/g, '-') || 'note'}.md`;
          link.click();
          URL.revokeObjectURL(link.href);
        }
        return;
      }
      if (name === 'import-note-text') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt,.md';
        input.onchange = (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            importNotesFromText(reader.result, profile, { title: file.name.replace(/\.[^.]+$/, '') });
            saveStoredProfile(profile);
            render();
          };
          reader.readAsText(file);
        };
        input.click();
        return;
      }
      if (name === 'import-file') {
        const fileInput = event.target;
        const file = fileInput.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          importNotesFromText(reader.result, profile, { title: file.name.replace(/\.[^.]+$/, '') });
          saveStoredProfile(profile);
          render();
        };
        reader.readAsText(file);
        return;
      }
      if (name === 'export-pdf') {
        const note = profile.notes.find((item) => item.id === noteId);
        if (note) {
          const printWindow = window.open('', '_blank', 'width=900,height=700');
          printWindow.document.write(`<html><head><title>${escapeHtml(note.title)}</title><style>body{font-family:Inter, sans-serif;padding:24px;} h1{font-size:24px;} p{line-height:1.6;}</style></head><body>${note.body}</body></html>`);
          printWindow.document.close();
          printWindow.focus();
          printWindow.print();
        }
        return;
      }
      if (name === 'print-note') {
        const note = profile.notes.find((item) => item.id === noteId);
        if (note) {
          const printWindow = window.open('', '_blank', 'width=900,height=700');
          printWindow.document.write(`<html><head><title>${escapeHtml(note.title)}</title></head><body>${note.body}</body></html>`);
          printWindow.document.close();
          printWindow.focus();
          printWindow.print();
        }
        return;
      }
      if (name === 'editor-command') {
        if (command === 'insertHTML') {
          document.execCommand('insertHTML', false, value || null);
        } else {
          document.execCommand(command, false, value || null);
        }
        return;
      }
    });

    rootEl.addEventListener('submit', function (event) {
      const form = event.target.closest('[data-role="auth-form"]');
      if (!form) return;
      event.preventDefault();
      const data = new FormData(form);
      const payload = Object.fromEntries(data.entries());
      const email = payload.email?.toString().trim();
      const password = payload.password?.toString().trim();
      const name = payload.name?.toString().trim();
      const remember = Boolean(payload.remember);
      const profile = getStoredProfile();
      if (state.authModal?.mode === 'signup') {
        profile.user.name = name || profile.user.name;
        profile.user.email = email;
        profile.user.rememberMe = remember;
        saveStoredProfile(profile);
        saveStoredAuth({ isAuthenticated: true, email, name: profile.user.name, rememberMe: remember });
        state.authModal = null;
        render();
        return;
      }
      if (state.authModal?.mode === 'login') {
        if (email === profile.user.email) {
          saveStoredAuth({ isAuthenticated: true, email, name: profile.user.name, rememberMe: remember });
          state.authModal = null;
          render();
        } else {
          state.authModal = { mode: 'login', message: 'We could not find that account. Try signing up for a free BioNexus account.' };
          render();
        }
        return;
      }
      if (state.authModal?.mode === 'forgot') {
        state.authModal = { mode: 'forgot', message: 'If that email exists, password reset instructions would be sent to it shortly.' };
        render();
      }
    });

    function authHelper(profile) {
      const auth = getStoredAuth();
      if (!auth || !auth.isAuthenticated) return false;
      return profile.user.email === auth.email;
    }

    const profile = getStoredProfile();

    window.addEventListener('keydown', function (event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        const noteArea = rootEl.querySelector('[data-role="note-editor"]');
        if (noteArea) {
          const profile = getStoredProfile();
          const note = profile.notes.find((item) => item.id === state.selectedNoteId);
          if (note) {
            note.body = noteArea.innerHTML;
            note.updatedAt = new Date().toISOString();
            saveStoredProfile(profile);
          }
        }
      }
    });

    if (state.currentView === 'notes' && !state.selectedNoteId && profile.notes.length) state.selectedNoteId = profile.notes[0].id;
    render();
  }

  function trackPageVisit(pageTitle, href) {
    return persistRecentVisit(pageTitle, href);
  }

  return {
    createEmptyStudentProfile,
    getProgressSnapshot,
    renderStudyNotesPage,
    initStudyNotesPage,
    trackPageVisit,
    getStoredProfile,
    saveStoredProfile,
    clearStoredAuth,
    getStoredAuth,
    addBookmark,
    createNote,
    exportNoteText,
    importNotesFromText,
    duplicateNote,
    addPlannerTask,
    addChecklistItem,
    addGlossaryEntry,
    toggleFavorite,
    ensureAuth,
    _state: null
  };
});
