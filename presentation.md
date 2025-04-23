# Heart Chat: AI-Powered Chatbot Project

---

## Project Overview

Heart Chat is a modern, responsive AI chatbot interface that integrates with large language models (LLMs) through a clean, heart-themed design.

The project combines a professional frontend interface with backend services and AI integration, providing a complete end-to-end solution.

---

## Business Value & USP

Heart Chat offers compelling business advantages as an enterprise-ready AI chat solution:

- **Cost Efficiency**: Reduce customer support costs by automating routine inquiries
- **24/7 Availability**: Provide constant service without staffing constraints
- **Scalable Customer Support**: Handle thousands of simultaneous conversations
- **Consistent Brand Experience**: Maintain uniform communication with customizable AI responses
- **Actionable Analytics**: Gain insights from conversation data to improve products and services
- **Seamless Integration**: Connect with existing CRM and knowledge management systems

Our USP is the combination of enterprise-grade functionality with an exceptionally intuitive user experience and rapid deployment capability.

---

## Architecture

Three-tier architecture:

- **Frontend**: Next.js application with TypeScript and Tailwind CSS v4
- **Backend**: Django-based API service with dedicated endpoints
- **LLM Integration**: n8n workflow automation for connecting to AI models

---

## Key Technologies: Frontend

- Next.js 15.3.0 (App Router) with React 19
- TypeScript for type safety
- Tailwind CSS v4 for styling (CSS-first approach)
- Motion library for animations

---

## Key Technologies: Backend

- Django REST framework for API endpoints
- PostgreSQL database (inferred from Docker setup)
- Token-based authentication system

---

## Key Technologies: AI Integration

- n8n workflow automation for orchestrating API calls
- Support for multiple AI providers (ChatGPT and DeepSeek)

---

## Core Features: Interactive Chat Interface

- Real-time message streaming simulation
- Markdown rendering for formatted responses
- Retry mechanism for failed messages
- Input field with automatic resizing

---

## Core Features: Conversation Management

- Persistent chat history with timestamps
- Conversation categorization by date
- Ability to delete conversations
- New chat session creation

---

## Core Features: User Experience

- Light/dark mode with system preference detection
- Responsive design for all device sizes
- Beautiful transitions and animations
- Custom cursor effects and tooltips

---

## Core Features: System Integration

- Server-sent events for streaming responses
- API proxying to avoid CORS issues
- Local storage for chat persistence
- Environment-based configuration

---

## Technical Highlights: Custom React Hooks

- **useChat**: Core hook that manages chat state and API interactions
- **useHoverCursor**: For custom cursor interactions
- **useFloatingTooltip**: For tooltip functionality

---

## Technical Highlights: Advanced UI Components

- Floating navbar with scroll-aware behavior
- Animated card stacks
- Custom cursor system with hover effects
- Message streaming indicators

---

## Technical Highlights: Performance Optimizations

- React component memoization
- Efficient state management
- Optimized animations with hardware acceleration

---

## Technical Highlights: Backend Processing

- LLM response streaming
- Error handling and retry mechanisms
- Search capabilities in the backend

---

## Deployment & Configuration: Docker Containerization

- Separate containers for frontend, backend, and n8n
- Docker Compose for orchestrating services
- Environment configuration through .env files

---

## Deployment & Configuration: API Configuration

- Webhook-based integration with n8n
- Proxy configuration in Next.js for API calls
- Custom headers for streaming support

---

## Future Potential

- Adding user authentication and multi-user support
- Expanding LLM provider options
- Implementing file upload capabilities
- Adding voice input/output options
- Enhanced search functionality in chat history

---

## Hackathon Value Proposition

Heart Chat demonstrates excellence through:

- Professional UI/UX design with attention to detail
- Full-stack implementation with modern technologies
- Thoughtful architecture supporting scalability
- Integration with cutting-edge AI technology
- Focus on user experience and accessibility

The project showcases both technical expertise and design thinking, making it an ideal hackathon submission that addresses real-world needs for intuitive AI interfaces.
