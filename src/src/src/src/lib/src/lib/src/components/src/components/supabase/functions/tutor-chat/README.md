# Code Tutor

A beginner-friendly coding tutor app: chat with an AI tutor, run JavaScript
examples live in the browser, and keep your conversation history saved to
your account forever.

## What's already done
- Login / signup screens (Supabase Auth)
- Per-user chat history, saved automatically, private to each account
- Live JS code execution with a "Run" button on every code block
- Edge Function that calls Claude securely (your API key never touches the browser)

## Setup
1. Database: run `supabase/schema.sql` in the Supabase SQL Editor (already done)
2. Project URL: already set in `src/lib/supabase.js`
3. Deploy the Edge Function with your Anthropic API key (final remaining step)

## Run locally
npm install
npm run dev
