# PRD: The Librarian Agent v0.1

**Author:** Manus AI (Dojo) & The 11-11 Community
**Status:** Draft
**Date:** January 11, 2026

## 1. Overview

The Librarian is a specialized AI agent within the 11-11 Workbench that acts as a proactive and reactive assistant for prompt engineering. Its primary goal is to enhance the user's workflow by providing intelligent suggestions, surfacing relevant information, and automating repetitive tasks.

## 2. User Problems

*   **Problem 1:** Users have to manually search for relevant information or previously used prompts, which is time-consuming and inefficient.
*   **Problem 2:** Users may not be aware of best practices or alternative approaches for prompt engineering, leading to suboptimal results.
*   **Problem 3:** Users struggle to manage and organize a large library of prompts, making it difficult to find and reuse them.

## 3. User Stories

*   **As a prompt engineer, I want** the Librarian to proactively suggest relevant prompts from my library based on the content I'm currently writing, **so that** I can reuse and adapt existing work.
*   **As a prompt engineer, I want** to be able to ask the Librarian for suggestions on how to improve my current prompt, **so that** I can get better results from the AI.
*   **As a prompt engineer, I want** the Librarian to automatically tag and categorize my prompts based on their content, **so that** I can easily find them later.

## 4. Features

### 4.1 Proactive Prompt Suggestions

*   The Librarian will monitor the user's current editor content and use semantic search to find relevant prompts from the user's library.
*   Suggestions will be displayed in a non-intrusive way, such as a subtle notification or a dedicated panel.
*   Users can click on a suggestion to view the full prompt and insert it into their current editor.

### 4.2 Reactive Prompt Critiques

*   Users can trigger a prompt critique by a dedicated command or button.
*   The Librarian will analyze the current prompt and provide suggestions for improvement based on best practices and a predefined set of rules.
*   Suggestions will be displayed as inline comments or in a separate panel.

### 4.3 Automated Prompt Tagging & Categorization

*   The Librarian will automatically generate tags and categories for new prompts based on their content.
*   Users can review and edit the generated tags and categories.
*   This will enable the advanced prompt management features planned for the current sprint.

## 5. Technical Requirements

*   **Semantic Search:** The Librarian will require a semantic search engine to power its proactive suggestions. We can leverage Supabase Vector (pgvector) for this, as it's already part of our tech stack.
*   **Natural Language Processing (NLP):** The Librarian will need NLP capabilities to understand the user's current editor content and to generate prompt critiques.
*   **Integration with the Context Bus:** The Librarian will subscribe to events on the Context Bus to stay informed about changes to the user's editor content.

## 6. User Flows

### 6.1 Proactive Suggestion Flow

1.  User types in the Monaco Editor.
2.  The Librarian, listening to the Context Bus, receives the updated content.
3.  The Librarian sends the content to the semantic search engine.
4.  The search engine returns a list of relevant prompts.
5.  The Librarian displays the top 3 suggestions in a dedicated panel.
6.  User clicks on a suggestion.
7.  The Librarian opens the selected prompt in a new editor tab.

### 6.2 Reactive Critique Flow

1.  User clicks the "Critique Prompt" button.
2.  The Librarian sends the current prompt to the NLP service.
3.  The NLP service returns a list of suggestions.
4.  The Librarian displays the suggestions as inline comments in the editor.
5.  User can accept or reject each suggestion.

## 7. Out of Scope for v0.1

*   Multi-modal search (images, sounds, etc.)
*   The Memory Palace (3D visualization)
*   Real-time collaboration features

## 8. Success Metrics

*   **Adoption:** Percentage of users who actively use the Librarian's features.
*   **Engagement:** Number of suggestions clicked, critiques requested, and tags accepted.
*   **User Satisfaction:** Qualitative feedback from users on the usefulness and usability of the Librarian.
*   **Time Saved:** Reduction in the average time it takes for a user to find a relevant prompt.
