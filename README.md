# KINKER Basel Website

Official website for KINKER Basel - Underground Techno Club

## 🚀 Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/technoontheblock-commits/Kinker)

### Environment Variables

Set these in your Vercel project settings:

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | ✅ |
| `RESEND_API_KEY` | Resend API key for emails | ✅ |
| `RESEND_FROM_EMAIL` | Sender email address | ✅ |

## 🛠 Local Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build
```

## 📁 Project Structure

```
app/
├── admin/          # Admin dashboard
├── api/            # API routes
├── events/         # Events pages
├── career/         # Career page
├── rental/         # Venue rental page
├── club/           # Club info page
├── location/       # Location page
components/         # React components
lib/               # Utilities & database
public/            # Static assets
```

## 🗄 Database Schema

Run the SQL in `supabase-schema.sql` in your Supabase SQL Editor.

## 📧 Features

- Event management with floor-based lineup
- Newsletter subscription with Resend
- Contact form with email notifications
- Venue rental inquiries
- Job postings & applications
- Admin dashboard for content management
