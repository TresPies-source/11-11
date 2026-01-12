# The Librarian Agent v0.3: Product Requirements Document (PRD)

**Author:** Manus AI (Dojo)
**Status:** Draft
**Date:** January 12, 2026

## 1. Overview

The Librarian is an AI-native agent that serves as a guide and collaborator for prompt engineers within the 11-11 Sustainable Intelligence OS. It provides proactive suggestions, reactive critiques, and automated organization to help users craft better prompts and discover new ideas.

## 2. The Unified "Librarian" Namespace

To create a seamless and intuitive user experience, the `/library` and `/gallery` pages will be deprecated and their functionality will be integrated into a unified `/librarian` namespace. This will create a single, powerful destination for all prompt management and discovery activities.

### 2.1. `/librarian`: The Librarian's Home

This will be the main landing page for The Librarian, providing a high-level overview of the user's prompt garden. It will feature the "Seedling" section for active prompts and a summary of the user's personal library.

### 2.2. `/librarian/greenhouse`: Your Personal Library

This page will replace the existing `/library` page and will be dedicated to the user's personal collection of mature, well-crafted prompts. It will feature the "Greenhouse" UI, with AI-generated imagery and advanced filtering and organization capabilities.

### 2.3. `/librarian/commons`: The Global Commons

This page will replace the existing `/gallery` page and will be dedicated to the community-driven "Wikipedia of Prompts." It will feature the 2D map UI, allowing users to explore and discover prompts from around the world.

## 3. The Librarian's Role & Features

### 3.1. Proactive Suggestions

- **User Problem:** I'm not sure how to improve my prompt, or I'm looking for new ideas.
- **User Story:** As a prompt engineer, I want The Librarian to proactively suggest improvements to my prompts and show me related prompts from my personal library and the Global Commons, so I can learn and improve.
- **Features:**
    - The Librarian monitors the user's editor content (debounced on keystroke).
    - It uses semantic search (Supabase Vector) to find related prompts.
    - Suggestions are displayed in a non-intrusive way on The Librarian's Home page.

### 3.2. Reactive Critiques

- **User Problem:** I'm not sure if my prompt is well-written.
- **User Story:** As a prompt engineer, I want The Librarian to give me feedback on my prompts, so I can understand their strengths and weaknesses and learn how to write better ones.
- **Features:**
    - The Librarian critiques prompts based on a predefined set of rules (Conciseness, Specificity, Context, Task Decomposition).
    - The critique score is displayed on the seedling card.
    - Detailed feedback is available in the editor.

### 3.3. Automated Tagging & Categorization

- **User Problem:** I don't have time to manually organize my prompts.
- **User Story:** As a prompt engineer, I want The Librarian to automatically tag and categorize my prompts, so I can easily find them later.
- **Features:**
    - The Librarian uses a combination of keyword extraction and AI-powered classification to automatically tag and categorize prompts.
    - Users can edit or add their own tags.

## 4. Technical Requirements

- **Frontend:** Next.js, Tailwind CSS, Framer Motion, D3.js (or similar)
- **Backend:** Supabase (PostgreSQL), Supabase Vector
- **AI:** OpenAI for embeddings and image generation

## 5. Success Metrics

- **User Engagement:** Time spent on The Librarian's Home page, number of prompts created and saved, number of prompts shared.
- **Prompt Quality:** Average critique score of prompts in the Greenhouse.
- **Community Growth:** Number of prompts in the Global Commons, number of active community members.
