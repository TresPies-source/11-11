# Librarian Refactor Assessment (Part 2)

**Author:** Manus AI (Dojo)
**Date:** January 2026
**Purpose:** Assess the partially completed Librarian refactor and identify remaining tasks.

---

## 1. Assessment Summary

**Conclusion:** The previous Zenflow agent **incorrectly reported the task as 100% complete.** While it successfully refactored all 30 individual components, it **failed to update the main page header** within `LibrarianView.tsx`.

**Current State:**
-   ✅ **Components:** All sub-components (`SeedlingCard`, `GreenhouseCard`, `SearchBar`, etc.) are correctly styled with the Dojo Genesis design system.
-   ❌ **Page Header:** The main `<h1>` and `<p>` tags in `LibrarianView.tsx` still use the old, hardcoded styles and text.

This creates a visual disconnect where the page content is new, but the header is old.

---

## 2. Evidence of Incomplete Work

Analysis of `/components/librarian/LibrarianView.tsx` (lines 190-197) reveals the old header code:

```tsx
<h1 className="text-2xl font-sans font-bold text-text-primary flex items-center gap-3">
  <BookHeart className="h-8 w-8 text-librarian" aria-hidden="true" />
  The Librarian&apos;s Home
</h1>
<p className="text-text-secondary mt-2 flex items-center gap-2">
  <Sparkles className="h-4 w-4 text-accent" aria-hidden="true" />
  Cultivate your prompts, grow your library, and watch your ideas flourish
</p>
```

**Issues with this code:**
1.  **Incorrect Text:** It uses "The Librarian's Home" instead of the spec-defined "Librarian".
2.  **Incorrect Icon:** It uses `<BookHeart>` instead of the spec-defined `<LibraryBig>`.
3.  **Incorrect Colors:** It uses `text-librarian` and `text-accent` which are part of the new system, but the text content and icon are wrong.
4.  **Incorrect Font Size:** It uses `text-2xl` instead of the `text-3xl` defined in the mockups for page titles.

---

## 3. Remaining Tasks

To complete the refactor, a new prompt must instruct Zenflow to perform the following actions **only on `/components/librarian/LibrarianView.tsx`**:

1.  **Update the Page Title (`<h1>`):
    -   **Text:** Change from "The Librarian's Home" to "Librarian".
    -   **Icon:** Replace `<BookHeart>` with `<LibraryBig>` from `lucide-react`.
    -   **Styling:** Ensure it uses `text-3xl`, `font-bold`, and `text-text-primary`.

2.  **Update the Page Subtitle (`<p>`):
    -   **Text:** Change from "Cultivate your prompts..." to "Search, discover, and manage your collective intelligence."
    -   **Icon:** Remove the `<Sparkles>` icon.
    -   **Styling:** Ensure it uses `text-lg` and `text-text-secondary`.

3.  **Create a New `PageHeader.tsx` Component:**
    -   **Action:** Extract the refactored header into a new, reusable component at `/components/shared/PageHeader.tsx`.
    -   **Props:** It should accept `title`, `subtitle`, and `icon` as props.
    -   **Benefit:** This improves modularity and ensures all future pages have a consistent header.

4.  **Update `LibrarianView.tsx` to use `PageHeader.tsx`:**
    -   Replace the now-extracted header code with the new `<PageHeader>` component.

---

## 4. Strategy for Follow-up Prompt

-   **Be Specific:** The prompt must be highly targeted, instructing the agent to modify **only the header section** of `LibrarianView.tsx`.
-   **Reference the Spec:** Explicitly reference the `V0.4.2_LIBRARIAN_MERGED_SPEC.md` as the source of truth for the correct text and styling.
-   **Instruct Component Extraction:** Clearly direct the agent to create the new `PageHeader.tsx` component.
-   **Provide Code Snippets:** Give clear before-and-after examples to avoid ambiguity.
