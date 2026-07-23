# Application UI & Implementation Blueprint

## Overview
This blueprint provides a comprehensive reference for building a versatile, offline-first file management and content generation application. It details the UI structure, core features, implementation patterns, and interactions required to replicate this app's core functionality in a new project. 

This document is designed to guide an AI coding agent or developer in constructing a new application with similar foundational features.

---

## 1. Core Feature Set

### 1.1 Offline-First File System (Local Database)
- **Local Storage:** The primary data source is a local IndexedDB database containing tables/stores for `files` and `folders`.
- **Properties:**
  - `id` (string, UUID)
  - `name` (string)
  - `type` ('file' | 'folder')
  - `parentId` (string | null - null for root)
  - `content` (string - only for files, plain text/markdown)
  - `createdAt`, `updatedAt` (timestamp)
  - `order` (number - for custom sorting/drag-and-drop)
- **Behavior:** The app fully functions without an internet connection. Data changes are saved locally immediately.

### 1.2 Cloud Synchronization
- **Backend-as-a-Service (BaaS):** Uses a service like Appwrite, Firebase, or Supabase.
- **Sync Logic:**
  - Users can manually trigger a sync (push local to cloud, or pull cloud to local).
  - Conflict resolution options: "Merge" (keep both, perhaps with timestamp checks) or "Overwrite" (local overwrites cloud, or cloud overwrites local).
- **Authentication:** Standard Email/Password login + session management.

### 1.3 Subscription & Payment Proof (Manual Validation)
- **Model:** Freemium. Free users have local-only features or limited AI usage; PRO users get cloud sync and advanced AI.
- **Crypto Payment Flow:**
  - UI provides an EVM wallet address to send USDT/USDC/ETH.
  - User copies the address, makes the payment in their own wallet app.
  - User comes back, clicks a "Paste URL" button to paste the block explorer transaction URL.
  - A confirmation dialog appears showing the pasted URL.
  - Upon submission, the URL is saved to the user's profile metadata/preferences in the database (status: 'pending').
  - Admin manually reviews the URL and updates the status to 'pro'.

### 1.4 AI Assistant
- **Contextual Generation:** User can select a folder or file and open an AI helper modal.
- **Modes:** 
  - Generate new file in folder.
  - Rewrite/Summarize existing file content.
- **Provider:** Connects to an AI API (e.g., OpenRouter, OpenAI, Gemini) using a user-provided API key or an app-wide API key.

---

## 2. UI/UX Structure & Components

### 2.1 Global Layout
- **Top Navigation Bar (Sticky):**
  - **Left:** App Logo and Name.
  - **Right:** 
    - Settings Button (Gear icon).
    - Language Switcher (Globe/Letter icon).
    - User Profile / Auth Status (Login button or Avatar).
- **Main Container:** Centered, responsive width (max-w-4xl), with adequate padding.

### 2.2 File Browser View
- **Breadcrumb Navigation:**
  - Shows current path (e.g., `Home > Projects > 2024`).
  - Each segment is clickable to navigate up the tree.
- **Toolbar:**
  - Search Input (filters current view or global).
  - "New File" Button (+ icon).
  - "New Folder" Button (+ icon).
  - "Select" Button (toggles multi-select mode).
- **List/Grid View:**
  - Displays files and folders in the current `parentId`.
  - Folders have a folder icon; Files have a document icon.
  - **Drag and Drop:** Items can be dragged over folders to move them, or dragged up/down to reorder.
- **Item Row Actions:**
  - Clicking a folder navigates into it.
  - Clicking a file opens the Editor.
  - "More Options" (vertical dots) opens a context menu.

### 2.3 Context Menus & Modals
- **Item Context Menu (for File/Folder):**
  - Rename
  - Move to... (opens a Folder Picker modal)
  - Duplicate/Copy
  - Delete (opens confirmation modal)
  - Ask AI (opens AI Helper modal with item as context)
- **Multi-Select Mode:**
  - Checkboxes appear next to items.
  - Bottom sticky bar appears with bulk actions: "Move Selected", "Delete Selected", "Cancel".
- **Folder Picker Modal:**
  - A drill-down list to select a destination folder for move/copy operations.

### 2.4 Text Editor View
- **Header:**
  - "Back" Button (returns to File Browser).
  - File Name Input (inline editing of the file title).
  - "Delete" Button.
  - "Ask AI" Button.
- **Body:**
  - A full-width/height `<textarea>` or rich-text editor for the file content.
  - Auto-saves content to local DB on change (debounced).

### 2.5 Settings & Subscription Dialog
- **Tabs/Sections:**
  - **Account:** Login/Logout, user info.
  - **Sync:** "Sync Now" button, conflict resolution options.
  - **Data:** Export JSON, Import JSON.
  - **AI Settings:** API Key input, Model selection dropdown.
  - **Subscription (PRO):** 
    - Card showing current status (Free, Pending, PRO).
    - Payment instructions (Wallet address + Copy button).
    - "Paste Transaction URL" button.
    - Confirmation modal for submitting the URL.

---

## 3. Implementation Details & Patterns

### 3.1 State Management Strategy
- Use React Hooks + Context for global states:
  - `useFileSystem`: Handles CRUD operations for files/folders interacting directly with IndexedDB.
  - `useAuth`: Manages user session.
  - `useDialog`: A global context to manage stacking modals (e.g., alert, confirm, prompt).

### 3.2 Drag and Drop Implementation
- Use standard HTML5 Drag and Drop API or a library (like `dnd-kit` or a polyfill for mobile).
- **Visual Feedback:** 
  - Highlight the target folder when an item is dragged over it.
  - Show a drag ghost/preview.

### 3.3 Styling Guidelines (Tailwind CSS)
- **Theme:** Clean, minimalist. White/light gray backgrounds, dark text.
- **Components:**
  - Use rounded corners (`rounded-xl` or `rounded-2xl`).
  - Subtle borders (`border-neutral-200`) instead of heavy shadows.
  - Interactive elements should have hover states (`hover:bg-neutral-100`) and active states (`active:scale-95`).
- **Typography:** Sans-serif, readable. Use smaller, uppercase tracking for labels.

### 3.4 API / Service Integration Points
- **Database (idb):** Wrap IndexedDB calls in async functions (`db.getFiles(parentId)`, `db.saveFile(file)`).
- **Cloud Backend:** Isolate SDK calls in a `lib/backend.ts` file so it can be easily swapped (e.g., from Appwrite to Firebase).
- **AI API:** Fetch requests to the AI provider should handle streaming responses for better UX.

## 4. Internationalization (i18n)
- Abstract all static text strings into a dictionary object.
- Provide a React Context `I18nProvider` to pass down the `t(key)` translation function.
- UI components should never hardcode text (e.g., use `{t('button.save')}` instead of `"Save"`).
