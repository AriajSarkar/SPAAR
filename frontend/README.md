# Heart Chat - Modern AI Chatbot UI

A beautiful, responsive chatbot interface built with Next.js (App Router), TypeScript, and Tailwind CSS v4, integrating with n8n for AI-powered conversations.

## 💙 Features

- Modern, responsive UI with heart-themed styling
- Support for ChatGPT and DeepSeek AI providers
- Message streaming simulation for natural conversation flow
- Light/dark mode with system preference detection and persistence
- Integration with n8n webhooks for backend processing

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router + TypeScript)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) - CSS-first approach (no `tailwind.config.js`)
- **UI Components**:
  - Custom shadcn/ui-inspired components
  - Aceternity UI-inspired animated components
- **Package Manager**: [pnpm](https://pnpm.io/)

## 📋 Requirements

- Node.js 16.8 or later
- pnpm
- n8n instance with webhook endpoint

## 🚀 Getting Started

### Installation

1. Clone the repository and navigate to the project folder:

```bash
cd frontend
```

2. Install dependencies:

```bash
pnpm install
```

3. Create a `.env.local` file in the project root with your n8n webhook URL:

```
N8N_WEBHOOK_URL="https://your-n8n-instance/webhook/your-webhook-path"
```

### Development

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Building for Production

Build the application for production:

```bash
pnpm build
```

Start the production server:

```bash
pnpm start
```

## 🎨 Customization

The app uses a heart-themed color palette:

| Token              | Light         | Dark      |
| ------------------ | ------------- | --------- |
| `--heart-blue-500` | `#3b82f6` (💙) | `#1e3a8a` |
| `--heart-blue-700` | `#1e40af`     | `#111827` |
| `--heart-cyan-500` | `#06b6d4` (🩵) | `#164e63` |
| `--heart-cyan-700` | `#0e7490`     | `#0f4a5c` |

These colors are used throughout the UI and can be customized in `src/styles/globals.css`.

## 📁 Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── app/             # App router pages
│   │   ├── api/         # API routes
│   │   ├── chat/        # Chat interface page
│   │   └── layout.tsx   # Root layout with ThemeProvider
│   ├── components/      # React components
│   │   ├── Navbar/      # Navigation components
│   │   ├── theme/       # Theme components
│   │   └── ui/          # UI components
│   ├── lib/             # Utility functions
│   └── styles/          # Global CSS
├── .env.local           # Environment variables (create this)
└── package.json         # Project dependencies
```

## 🔧 n8n Integration

The app expects your n8n webhook to:

1. Accept a `msg` query parameter with the user's message
2. Accept an optional `provider` query parameter ('chatgpt' or 'deepseek')
3. Return a JSON response with a `response` property containing the AI's reply

Configure your n8n workflow to process these inputs and return the appropriate response.

## 📝 License

MIT
