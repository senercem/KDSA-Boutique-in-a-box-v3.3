# Koru Decision-Science Architecture (KDSA) v3.3

[![Koru Impact](https://img.shields.io/badge/Koru_Impact-Internal_Project-blueviolet)](https://koruimpact.org)
[![License](https://img.shields.io/badge/License-Proprietary-red)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Active_Development-brightgreen)](https://github.com/koru-impact/KDSA)
[![Tech Stack](https://img.shields.io/badge/Tech-%20.NET%208.0%20%7C%20C%23-blue)](https://dotnet.microsoft.com/en-us/download/dotnet/8.0)

---

## 🚀 About The Project

**KDSA (Koru Decision-Science Architecture)** is a **headless** **Component-as-a-Service (CaaS)** engine designed to address systemic failures in corporate decision-making, manage human cognitive biases, and ensure robust AI governance.

This project is not a traditional "SaaS Product." Instead, it is conceived as an **"Engine-in-Accelerator"**—a backend solution designed to be embedded into the existing platforms of our partners (e.g., "Big Four" consulting firms), powering their services from behind the scenes.

---

## 🎯 The Core Problem Solved: The Triad of Decision Risk

KDSA addresses three interconnected market failures within a single, integrated loop:

1.  **Human-Factor Risk (M1):** The human dynamics—such as cultural resistance, change fatigue, and a lack of psychological safety—that cause over 70% of digital transformation projects to fail.
2.  **Cognitive-Bias Risk (M2):** The tendency for executives, especially under stress, to revert to intuitive, error-prone "System 1" thinking instead of analytical "System 2" reasoning, leading to costly errors (e.g., Optimism Bias).
3.  **Algorithmic & Governance Risk (M3):** The legal and operational risks arising from non-compliance with strict new regulations like **DORA** and the **EU AI Act**, and the use of opaque, unauditable AI/ML models.

---

## 🏗️ Architectural Vision: "The Golden Thread"

The system is built upon a continuous **"Sense -> Decide -> Govern"** loop. This seamless and auditable flow of data is referred to as **"The Golden Thread."** Data enters at one end, is processed and enriched, and the entire lifecycle is logged immutably.

### The Modules

-   **M1: ACORE (Sensing Layer):** The data ingestion and analysis layer that senses organizational risks, cultural dynamics, and the human factor.
-   **M2: Decision Engine (Cognitive Circuit-Breaker):** Uses advanced AI models like Google Gemini to analyze critical decisions, conduct "pre-mortem" analyses (anticipating potential failure modes), and flag cognitive biases to the decision-maker.
-   **M3: Project Alexandra (Governance Layer):** The definitive governance layer that captures all data, analyses, and final decisions from the M1 and M2 modules into an immutable **Audit Log**, ensuring full compliance with regulations like DORA and the EU AI Act.

---

## 💻 Technical Stack & Clean Architecture

To ensure maintainability, flexibility, and ease of integration, the project is built on **.NET 8.0** following the industry-standard **Clean Architecture** principles.

### Backend (.NET 8.0)

-   **`KDSA.Domain`**: The heart of the application. Contains the core business logic and entities, with zero dependencies on the outside world.
-   **`KDSA.Application`**: Defines the use cases and service interfaces. It dictates _what_ the system can do.
-   **`KDSA.Infrastructure`**: Implements the interfaces defined in the Application layer. This is where integrations with external services like Google Gemini and Baserow (database) live.
-   **`KDSA.API`**: The outermost layer, exposing the headless REST API endpoints for partners to consume.

### Frontend (Partner Accelerator)

-   **React + TypeScript**: A lightweight presentation layer used to simulate partner systems or provide simple UIs for demonstration and testing.

### Operational Infrastructure

-   **Google Cloud Platform (GCP):** The primary cloud infrastructure provider.
-   **Baserow (Self-Hosted):** A self-hosted open-source database platform running on GCP to ensure data sovereignty and full control over the operational data store.

---

## 🛠️ Getting Started: Setup and Development

### Prerequisites

-   [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
-   [Visual Studio 2022](https://visualstudio.microsoft.com/) or [VS Code](https://code.visualstudio.com/)
-   **Google Gemini API Key**: Must be configured in the Infrastructure layer.
-   **Baserow API Token & Table ID**: Must be configured in the Infrastructure layer.

### How To Run

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    ```
2.  **Configure API Keys:**
    Open the `KDSA.API/appsettings.json` file and update the following sections with your credentials:
    ```json
    "Gemini": {
      "ApiKey": "YOUR_GEMINI_API_KEY_HERE",
      "BaseUrl": "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
    },
    "Baserow": {
      "BaseUrl": "https://baserow.koruimpact.org",
      "ApiToken": "YOUR_BASEROW_API_TOKEN_HERE",
      "AuditLogTableId": "YOUR_BASEROW_TABLE_ID_HERE"
    }
    ```
3.  **Run the backend:**
    Launch the `KDSA.API` project using the `https` profile from Visual Studio or the `dotnet run` command.
4.  **Connect a frontend (if applicable):**
    Update the `BACKEND_URL` constant in your frontend application (e.g., in a `geminiService.ts` file) to point to the running backend address (e.g., `https://localhost:7162`).

---

## 📜 License and Documentation

This project is the property of **Koru Impact**. For a detailed understanding of the strategic vision, architectural decisions, and use cases, please refer to the documents in the `docs` folder, especially the **KDSA Playbook v3.3** and the technical guides in `docs/technical`.
