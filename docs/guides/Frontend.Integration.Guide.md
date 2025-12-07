# Guide 5: Frontend Integration Strategy

## 1. Introduction

This document outlines the recommended strategy for building a frontend user interface for the KDSA engine. The goal is to create a professional, scalable, and maintainable web application that effectively consumes the `KDSA.API`. This guide covers the core architectural decision, the recommended tech stack, and a brief implementation overview.

---

## 2. Strategic Decision: Integrated Dashboard vs. Standalone Application

The most critical initial decision is *where* the KDSA frontend should live. There are two primary approaches:

**Option A: Integrate into an Existing Admin Dashboard**
The KDSA interface would be a new section within an existing web application (e.g., the main Koru Impact company dashboard).

**Option B: Build as a Standalone Application**
The KDSA interface would be a completely separate web application, potentially on its own subdomain (e.g., `kds-engine.koruimpact.org`).

### Comparison

| Aspect                | Option A: Integrated Dashboard                                | Option B: Standalone Application                              |
| --------------------- | ------------------------------------------------------------- | ------------------------------------------------------------- |
| **Architecture**      | Tightly coupled; monolithic.                                  | Decoupled; follows microservices principles.                |
| **User Experience**   | Seamless for existing users; single login.                    | Potentially disjointed; may require separate login (or SSO).  |
| **Development Speed** | Faster initially (shared components, auth).                   | Slower start (requires new setup, auth, boilerplate).       |
| **Scalability**       | Scales with the monolith; cannot scale independently.         | Can be scaled, deployed, and updated independently.         |
| **Technology Stack**  | Constrained by the existing application's stack.              | Freedom to choose the best tools for the job.               |
| **Long-Term Goal**    | Good for an internal tool or a small feature set.             | **Ideal for a dedicated, partner-facing product.**          |

### Recommendation

For the KDSA project, a **Standalone Application (Option B) is the superior architectural choice.**

**Rationale:** KDSA is designed as a powerful, specialized "engine." A standalone application aligns perfectly with this philosophy, allowing it to have its own lifecycle, technology stack, and security context. It prevents bloating the main admin dashboard and provides a clean, dedicated interface for partners or specialized internal teams who will use the engine.

---

## 3. Recommended Tech Stack

This stack is modern, robust, and provides an excellent developer experience for building a data-intensive application.

-   **Framework:** **Next.js (App Router) with TypeScript**
    -   *Why:* As you prefer, it offers a powerful foundation with Server-Side Rendering (SSR), Static Site Generation (SSG), and a robust routing system. The App Router is the future of Next.js.

-   **Data Fetching & State Management:** **TanStack Query (React Query)**
    -   *Why:* It is the industry standard for managing server state. It expertly handles caching, background refetching, and isLoading/isError states, dramatically simplifying the logic required to interact with the `KDSA.API`.

-   **Styling:** **Tailwind CSS**
    -   *Why:* A utility-first CSS framework that allows for rapid UI development without writing custom CSS.

-   **UI Components:** **Shadcn/UI**
    -   *Why:* Provides beautifully designed, accessible, and unstyled components that you can copy and paste into your project. It's built on Tailwind CSS and is extremely flexible.

-   **Internationalization (i18n):** **`next-intlayer`**
    -   *Why:* Given your positive experience with it and issues with alternatives, `next-intlayer` is the recommended choice. It is a powerful and flexible library designed for modern Next.js applications.

---

## 4. Implementation Guide

### 4.1. Connecting to the `KDSA.API`

The .NET backend and the Next.js frontend will run on different ports (and eventually different domains). This will require **CORS (Cross-Origin Resource Sharing)** to be configured in the `KDSA.API` project. You will need to add a CORS policy in `Program.cs` to allow requests from your frontend's domain.

**Example `KDSA.API/Program.cs` CORS Configuration:**
```csharp
// Before builder.Build();

var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";

builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
                      policy  =>
                      {
                          policy.WithOrigins("http://localhost:3000") // Your Next.js dev URL
                                .AllowAnyHeader()
                                .AllowAnyMethod();
                      });
});

var app = builder.Build();

// After app.UseHttpsRedirection();
app.UseCors(MyAllowSpecificOrigins);

// ... rest of the file
```

### 4.2. Creating an API Client in Next.js

It is a best practice to create a dedicated service or a set of functions to handle all communication with the backend.

**Example (`/lib/kds-api.ts`):**

```typescript
import { AISystemContext, ComplianceArtifact, ModelMetric } from "@/types/kds"; // Define these types based on the .NET Entities

const API_BASE_URL = process.env.NEXT_PUBLIC_KDSA_API_URL || "https://localhost:7162";

export async function analyzeDecision(context: string): Promise<{ analysis: string }> {
    const response = await fetch(`${API_BASE_URL}/api/DecisionEngine/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context }),
    });

    if (!response.ok) {
        throw new Error("Failed to analyze decision");
    }
    return response.json();
}

export async function getComplianceArtifact(systemId: string): Promise<ComplianceArtifact> {
    const response = await fetch(`${API_BASE_URL}/api/v1/Compliance/artifact/${systemId}`);
    if (!response.ok) {
        throw new Error("Failed to fetch compliance artifact");
    }
    return response.json();
}

// ... other functions for registerContext, ingestMetrics etc.
```

### 4.3. Using TanStack Query in a Component

With the API client in place, you can use TanStack Query in your React components to fetch data.

**Example (`/app/components/DecisionAnalyzer.tsx`):**
```typescript
'use client';

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { analyzeDecision } from "@/lib/kds-api";

export function DecisionAnalyzer() {
    const [context, setContext] = useState("");

    const mutation = useMutation({
        mutationFn: analyzeDecision,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(context);
    };

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <textarea
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="Enter decision context..."
                />
                <button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? "Analyzing..." : "Analyze"}
                </button>
            </form>

            {mutation.isError && <p>Error: {mutation.error.message}</p>}
            {mutation.isSuccess && (
                <div>
                    <h3>Analysis Result:</h3>
                    <p>{mutation.data.analysis}</p>
                </div>
            )}
        </div>
    );
}
```
This example shows how to build a simple form that calls the API and cleanly handles loading, error, and success states, letting TanStack Query manage the complexity.
