# The Librarian Agent v0.1: Product Requirements Document (PRD) - Updated

**Author:** Manus AI (Dojo)
**Status:** Draft
**Date:** January 11, 2026

## 1. Overview

The Librarian is an AI-native agent that serves as a guide and collaborator for prompt engineers within the 11-11 Sustainable Intelligence OS. It provides proactive suggestions, reactive critiques, and automated organization to help users craft better prompts and discover new ideas.

## 2. The "Librarian's Home" Page

The primary user interface for The Librarian is a dedicated page called "The Librarian's Home." This page is a dynamic, visual, and interactive space designed to feel like a "garden of prompts." It is divided into three main sections:

### 2.1. The "Seedling" Section: Your Active Prompts

- **User Problem:** I need a clear overview of my current work-in-progress prompts and their quality.
- **User Story:** As a prompt engineer, I want to see all of my active prompts in one place, with a quick visual indicator of their quality, so I can easily track my work and prioritize my efforts.
- **Features:**
    - Each active prompt is represented as a "seedling" card.
    - The card displays a snippet of the prompt, its current critique score, and a visual indicator of its growth.
    - Clicking on a seedling takes the user to the editor, with The Librarian's critique and suggestions already loaded.

### 2.2. The "Greenhouse" Section: Your Personal Library

- **User Problem:** I need a way to organize and browse my collection of mature, well-crafted prompts.
- **User Story:** As a prompt engineer, I want to save my best prompts to a personal library, with a beautiful and inspiring visual representation, so I can easily find and reuse them later.
- **Features:**
    - Each saved prompt is a "flowering plant" card, with an AI-generated image representing the prompt's essence.
    - The Greenhouse is searchable and filterable.
    - Users can organize their plants into "garden beds" (collections).
    - Users can share their garden beds with others.

### 2.3. The "Global Commons" Section: The Wikipedia of Prompts

- **User Problem:** I want to discover new ideas and learn from the work of other prompt engineers.
- **User Story:** As a prompt engineer, I want to explore a vast, community-driven collection of prompts, so I can discover new techniques, get inspiration, and collaborate with others.
- **Features:**
    - A 2D map UI where each prompt is a point of light.
    - Users can zoom, pan, and see prompts clustered by topic or theme.
    - Clicking on a point of light reveals the prompt and its history (creator, forks, evolution).

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
