# Backend Architecture Decisions

This document outlines the core architectural decisions for the ACM Store backend, specifically regarding our choice of framework, routing, and serverless runtime environments.

## 1. Why Next.js App Router (Instead of Express.js)

The project uses Next.js API Routes (App Router `route.ts` files) rather than a standalone Express.js/Node.js server. 

### Key Benefits:
- **Unified Codebase:** Frontend and backend live in the same repository. We can easily share TypeScript interfaces (e.g., `Product`, `Order`) between the database schema and React components without publishing internal NPM packages or syncing multiple repositories.
- **Simplified Deployment:** Platforms like Vercel automatically detect API routes and deploy them as highly scalable serverless functions. We don't need to configure Docker containers, Nginx reverse proxies, or manage EC2 instances.
- **Reduced Infrastructure Overhead:** There is no "always-on" server to crash, monitor, or pay for during idle times. The infrastructure scales automatically with user traffic.

## 2. Serverless Architecture & The Edge Runtime

Because our backend routes are deployed as serverless functions, they are susceptible to "cold starts" (a brief delay when a function boots up after a period of inactivity). 

To mitigate this and provide the fastest possible experience, we utilize Next.js's **Edge Runtime** where applicable.

### What is the Edge Runtime?
The standard Node.js runtime boots up a full Node.js environment, which is powerful but relatively slow to start. The Edge runtime is based on V8 isolates (similar to Cloudflare Workers). It is highly restricted (e.g., no native file system access) but boots almost instantly (0-10ms).

### Implementation Details:
- **Products API (`/api/v1/products`):** Configured to use the Edge Runtime (`export const runtime = 'edge';`). Since these routes only communicate with Supabase via HTTP, they are perfectly compatible with the Edge runtime. This ensures that the storefront loads product data instantly, even for the first visitor of the day, maximizing SEO and user experience.
- **Checkout & Verification APIs (`/api/checkout`):** These routes continue to use the standard **Node.js Runtime**. Payment gateways (like Razorpay) and signature verification mechanisms rely on core Node.js modules like `crypto` which are not fully supported in the Edge environment. A slight cold-start delay during the checkout phase is an acceptable trade-off for payment security and SDK compatibility.

## 3. Database: Supabase (PostgreSQL)
Our serverless functions interact with Supabase. Supabase provides out-of-the-box connection pooling (PgBouncer), which is essential for serverless architectures. Without pooling, thousands of concurrent serverless edge functions could exhaust the database connection limits.
