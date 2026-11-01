# Between the Pages

*A cozy interactive library where books become memories.*

## 1. Project Overview

Between the Pages is an interactive reading companion that turns a personal reading collection into a small virtual library.

Instead of simply storing book titles, users can revisit books, explore personal memories, interact with visitors, and record their thoughts through a daily journal.

The project explores how digital interaction can make reading more personal, emotional, and memorable.

## 2. Intended Users

The project is designed for people who enjoy reading and want to keep a personal record of their reading experiences, memories, and reflections.

## 3. Main Interactions

- Enter the virtual library through the opening screen.
- Explore books and view their details.
- Add books to the personal collection.
- Search for books by title or author.
- Interact with visitors through dialogue choices.
- Write and revisit daily journal entries.

## 4. How to Run

Between the Pages is a browser-based interactive project built with **React, TypeScript, Vite, and Tailwind CSS 4**.

### Requirements

- Node.js (Node.js 24.22.1 was used during development)
- pnpm
- A modern web browser (Chrome, Safari, or Edge)

### Installation

Clone or download the repository and open the project folder in a terminal.

Install the dependencies:

```bash
pnpm install
```

All dependencies are documented in `package.json`, with exact resolved versions recorded in `pnpm-lock.yaml`.

### Start the Development Server

```bash
pnpm dev
```

Open the local URL displayed in the terminal to access the experience. For example:

```text
http://localhost:5173/
```

### Build for Production

```bash
pnpm build
```

### Preview the Production Build

```bash
pnpm preview
```

## 5. Screenshots

The following screenshots demonstrate the main features of Between the Pages:

- **Opening Screen:** The main interface and overall visual atmosphere.
- **Library:** The book collection and book selection experience.
- **Book Details:** Book introductions, themes, and reading content.
- **Reading Companion:** Interactive conversations and opinion choices.
- **Journal:** The daily reading reflection generated from the interaction.

Add your screenshots to the `docs/` folder:

```text
docs/
├── opening-screen.png
├── library.png
├── book-details.png
├── reading-companion.png
└── journal.png
```

## 6. Known Limitations

- The project is currently a browser-based prototype and does not provide cloud-based synchronisation of reading history.
- The reading companion experience may have a limited range of conversation topics and responses.
- Background music autoplay depends on browser policies. Some browsers may require user interaction before audio can play.
- The project has been tested locally, but compatibility across different devices and browsers may require further testing.

## 7. Credits

- **Development tools:** React, TypeScript, Vite, Tailwind CSS, and pnpm.
- **AI assistance:** ChatGPT and VS Code AI were used for brainstorming, coding support, debugging, and documentation.
- **Visual assets:** AI-generated illustrations and other visual resources used in the project.
- **Audio:** First Light Particles – Yoiyami.This piece of music is released under a CC0 public domain license; it may be used for free in both personal and commercial projects, with no requirement for attribution.
