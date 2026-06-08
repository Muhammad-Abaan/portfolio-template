# Portfolio Template

A clean, highly customizable personal portfolio and data science documentation hub template. This custom React application features an automated blog pipeline, a data vault for artifacts, an analytics dashboard, and dynamic project displays. 

It has been stripped of personal information and is ready for you to clone, customize, and deploy.

## Features
- **Responsive Architecture**: Distinct mobile-optimized layouts vs widescreen desktop layouts using a robust `useIsMobile` hook routing system.
- **Data-Driven CMS**: Built-in admin dashboard route to add, edit, and delete blogs, projects, and artifacts.
- **Native Analytics Command Center**: Completely custom backend tracking without Google Analytics overhead (requires Supabase).
- **Intelligent Pagination & Filtering**: Client-side filtering logic with instant fallback for search and tag mechanisms.
- **Mocked by Default**: Comes with a mock local database client so you can run and test the UI immediately without setting up a backend.

## Tech Stack
- **Framework**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Routing**: [React Router](https://reactrouter.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Framer Motion](https://www.framer.com/motion/)
- **Database / Backend**: [Supabase](https://supabase.com/) (Optional / Configurable)
- **Content Engine**: Custom MDX integration with `react-markdown` and syntax highlighting.
- **Components**: [shadcn/ui](https://ui.shadcn.com/)

## Getting Started

To run this project locally, ensure you have Node.js installed.

1. **Install dependencies**:
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```
   The site will be available at `http://localhost:8080`.

3. **Build for production**:
   ```bash
   npm run build
   ```

## Customization Guide

To make this template your own, you'll need to update a few key areas:

1. **Personal Data**: 
   - Update `src/data/socials.ts` with your social media links.
   - Modify the static text in `src/pages/Index.tsx` and `src/pages/MobileIndex.tsx` to reflect your background.
   - Replace `/public/my_icon.png` and `/public/favicon.ico` with your own avatars.
   - Update the SEO metadata in `index.html`.

2. **Contact Form**: 
   - The contact form is wired up for [Web3Forms](https://web3forms.com/). Get your free Access Key and update the `access_key` payload in `src/pages/Contact.tsx` and `src/pages/MobileContact.tsx`.

3. **Connecting a Real Database (Supabase)**:
   - The template currently intercepts database calls using a mock client in `src/lib/supabase.ts` so it runs out-of-the-box.
   - To use a real database, create a `.env.local` file with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
   - Revert or modify `src/lib/supabase.ts` to use `@supabase/supabase-js` `createClient`.
   - Setup the following tables in Supabase:
     - `posts`: Dynamic blog posts, views, likes.
     - `projects`: Portfolio projects and case studies.
     - `artifacts`: Shared models, datasets, or PDFs.
     - `page_views` / `page_stats`: Native tracking and analytics pipeline.

## Default Admin Access
To view the admin dashboard and test the CMS locally using the mock database, navigate to `/login` and use the password:
- **Password**: `admin123`
