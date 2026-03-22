# KINKER BASEL

An immersive, dark-themed website for an underground techno club in Basel, Switzerland.

Built with **Next.js 14**, **Supabase**, **Vercel**, and **Resend**.

![KINKER Basel](public/images/preview.png)

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Database**: [Supabase](https://supabase.com/)
- **Hosting**: [Vercel](https://vercel.com/)
- **Email**: [Resend](https://resend.com/)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Animations**: Framer Motion
- **Icons**: Lucide React

## Features

### Dynamic Events
- Events loaded from Supabase database
- Server-side rendering for SEO
- Automatic revalidation every 60 seconds
- Event filtering by type (Clubnight, Special, Festival)

### Newsletter
- Email subscription with Supabase
- Confirmation emails via Resend
- API route for subscriptions

### Email Integration
- Contact form with Resend
- Auto-reply to users
- Newsletter confirmation emails

### Performance
- Server Components for fast initial load
- Edge Functions on Vercel
- Image optimization
- Responsive design

## Project Structure

```
my-app/
├── app/
│   ├── api/               # API Routes
│   │   ├── subscribe/     # Newsletter signup
│   │   └── contact/       # Contact form
│   ├── events/            # Events pages
│   ├── club/              # Club info page
│   ├── location/          # Location page
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/               # shadcn components
│   ├── hero-section.tsx
│   ├── events-section.tsx
│   ├── newsletter-section.tsx
│   └── ...
├── lib/
│   ├── supabase.ts       # Supabase client
│   ├── database.types.ts # TypeScript types
│   ├── events.ts         # Event fetching functions
│   └── utils.ts
├── .env.example          # Environment variables template
├── DEPLOY.md            # Deployment guide
├── supabase-schema.sql  # Database schema
└── vercel.json          # Vercel configuration
```

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Resend account

### Installation

```bash
# Clone repository
git clone <repository-url>
cd Kinker/my-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev
```

### Environment Variables

Create `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Resend
RESEND_API_KEY=re_your-api-key
```

### Database Setup

1. Create a Supabase project
2. Run the SQL in `supabase-schema.sql`
3. Your database is ready!

## Deployment

See [DEPLOY.md](./DEPLOY.md) for detailed deployment instructions.

### Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/kinker-basel)

## Pages

| Page | Description |
|------|-------------|
| `/` | Homepage with hero, events, newsletter |
| `/events` | All events with filtering |
| `/events/[id]` | Event detail page |
| `/club` | Club info, opening hours, FAQ |
| `/location` | Location, directions, map |

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/subscribe` | POST | Newsletter signup |
| `/api/contact` | POST | Contact form submission |

## Design Philosophy

- **Dark Mode Only** - Pure black (#000) background
- **Red Accents** - Signature #ef4444 for CTAs
- **Glitch Effects** - Subtle distortion animations
- **Industrial** - Raw, underground aesthetic
- **Mobile First** - Optimized for club audience

## Club Values

- **Safe Space** - Everyone is welcome
- **No Discrimination** - Zero tolerance for hate
- **Respect & Consent** - Look out for each other
- **Underground Culture** - Authentic techno experience

## License

Private - For KINKER Basel

---

**KINKER BASEL**
Hard Techno in Basel
No Racism. No Hate. Just Music.
