# Product Requirements Document (PRD)

## Project Name
AksaraLumina

## 1. Overview
AksaraLumina is a versatile, offline-first file and notes management application. It provides users with a comprehensive file system interface, enabling the creation, organization, and manipulation of files and folders directly in the browser. It integrates Appwrite for cloud synchronization and AI for automated content generation. Additionally, it offers a PRO subscription model validated manually via cryptocurrency transaction proofs.

## 2. Core Features & Capabilities

### 2.1. File System Management
- **Hierarchy & Navigation:** Users can create nested folder structures, navigate via breadcrumbs, and view their current path.
- **File Operations:** Support for creating new files and folders, renaming, moving, copying, deleting, and reordering items within a folder.
- **Bulk Operations:** Multi-selection mode allows users to move, copy, reorder, or delete multiple items simultaneously.
- **Search:** Real-time search functionality across the entire file system hierarchy.
- **Drag and Drop:** Users can move items into folders and reorder them via drag-and-drop interactions.

### 2.2. Offline-First & Synchronization
- **Local Persistence:** Data is stored locally (via IndexedDB), ensuring the app works perfectly offline.
- **Cloud Sync:** Integration with Appwrite allows users to log in, register, and sync their local data to the cloud. Users can choose to merge or overwrite data during synchronization.
- **Export/Import:** Users can export their entire workspace as a JSON file and import it back, offering an alternative backup and transfer method (with a 5MB limit).

### 2.3. AI Assistant
- **Generative AI:** Users can select files or folders and prompt the AI to generate new content or perform operations based on the selected context.
- **Auto-Save:** Generated content can be automatically saved as new files in the designated target folder.

### 2.4. PRO Subscription Model
- **Subscription Tier:** A premium tier ("PRO Aktif") offering benefits like unrestricted cloud storage, premium AI model access (e.g., GPT-4, Claude 3), and priority sync for Rp 5.000 / minggu.
- **Crypto Payment Integration:** Users subscribe by transferring funds (USDT/USDC/ETH on EVM networks) to a specified wallet address.
- **URL Proof Submission:** Users validate their payment by providing the blockchain explorer URL of their transaction. Features a 1-click clipboard paste button, a validation link preview to double-check the URL, and a confirmation modal before final submission.

### 2.5. Internationalization (i18n)
- **Multi-language Support:** The app includes a language switcher supporting Bahasa Indonesia, English, 简体中文, Français, 日本語, Tiếng Việt, and 繁體中文.

## 3. Technical Architecture

- **Frontend Framework:** React 19 with Vite.
- **Styling:** Tailwind CSS (v4) for utility-first styling.
- **Icons:** `lucide-react` for a consistent, modern icon set.
- **Database & Auth:** Appwrite SDK for backend-as-a-service (BaaS) handling authentication and cloud data syncing. Local data relies on `idb`.
- **Drag & Drop:** `mobile-drag-drop` polyfill/library for robust drag-and-drop support across devices.
- **State Management:** Custom React hooks (`useFileSystem`, `useAppwriteSync`, `useDialog`) manage complex local and remote states. Lazy loading is used for heavier components like the Editor and AI Helper.

## 4. UI/UX Design

- **Layout:** A clean, modern interface featuring a sticky top navigation bar for settings, language, and notifications, alongside a breadcrumb and file-action toolbar.
- **Modals & Dialogs:** Custom implementations for alerts, prompts, confirmations, settings, and payment proofs (`DialogContext`).
- **Responsive:** Designed with mobile-first principles to work smoothly on mobile and desktop environments.
- **Notifications:** Built-in toast notifications (via `sonner`) for non-obtrusive user feedback.

## 5. Security & Data Privacy
- Offline-first design implies user data primarily lives on the user's device unless explicitly synced to the cloud.
- Authentication relies on Appwrite's secure email/password and session management.
- The payment proof mechanism relies on user-provided public explorer URLs, avoiding direct wallet connections which minimizes user risk.
