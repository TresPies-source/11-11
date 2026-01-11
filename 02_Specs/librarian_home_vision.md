# The Librarian's Home: A Vision for Sustainable Intelligence

## The Core Experience: A "Garden of Prompts"

Instead of a simple list or search bar, The Librarian's Home is a dynamic, visual, and interactive space designed to feel like a "garden of prompts." It's a place for discovery, cultivation, and collaboration. The page is divided into three main sections:

### 1. The "Seedling" Section: Your Active Prompts

This is where your current work-in-progress prompts live. Each prompt is represented as a "seedling" card, showing a snippet of the prompt, its current critique score, and a visual indicator of its growth (e.g., a small plant that grows as the prompt improves). Clicking on a seedling takes you to the editor, with The Librarian's critique and suggestions already loaded.

### 2. The "Greenhouse" Section: Your Personal Library

This is your personal collection of mature, well-crafted prompts. Each prompt is a "flowering plant" card, with a beautiful, AI-generated image representing the prompt's essence. The Greenhouse is searchable and filterable, but it's also designed for browsing and rediscovery. You can organize your plants into "garden beds" (collections) and share them with others.

### 3. The "Global Commons" Section: The Wikipedia of Prompts

This is the community-driven "Wikipedia of Prompts." It's a vast, explorable landscape of prompts from around the world. The UI is a 2D map, where each prompt is a point of light. You can zoom in and out, pan around, and see prompts clustered by topic or theme. Clicking on a point of light reveals the prompt and its history, including who created it, who has forked it, and how it has evolved over time.

## The Librarian's Role: A Guide, Not a Gatekeeper

The Librarian is always present on this page, but it's not a chatbot or a search bar. It's a subtle, ambient presence. It might highlight a particularly interesting prompt in the Global Commons, suggest a new garden bed for your Greenhouse, or offer a gentle nudge to improve a seedling. The interaction is designed to be calm, inspiring, and non-intrusive.

## Technical Implications

- **Dynamic UI:** The page will be highly dynamic and interactive, likely using a library like Framer Motion for animations and transitions.
- **AI-Generated Imagery:** We'll need to integrate an image generation model to create the visuals for the Greenhouse and the Global Commons.
- **2D Map UI:** The Global Commons will require a 2D map library (e.g., D3.js or a similar library) to create the explorable landscape.
- **Supabase Backend:** Supabase will be used to store all prompt metadata, including the AI-generated images, the critique scores, and the user's personal library.

This vision for The Librarian's Home transforms it from a simple utility into a core part of the 11-11 experience. It's a place where users can not only manage their prompts but also discover new ideas, collaborate with others, and grow as prompt engineers.
