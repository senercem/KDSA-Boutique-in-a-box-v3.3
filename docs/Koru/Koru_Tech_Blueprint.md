# **2.0 Koru Impact \- Technical & Digital Architecture**

This document outlines the definitive technical and digital architecture for Koru Impact, serving as the single source of truth for the development team. It is a synthesis of the Integrated Architecture Document, Technical Blueprint, and various Debriefs, translating strategic goals into an operationalized technical reality.2. Koru Impact Digital & Technical BlueprintPart I: Core Architecture and Technology Stack

The platform is designed as a decoupled, multi-component system (Backend API and separate Frontend website) to ensure independent development, deployment, and scalability.1. Backend Architecture (API)

| Component        | Selection                | Rationale / Details                                                                                                                                            |
| :--------------- | :----------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Runtime**      | .NET 8 / C#              | Provides a robust, high-performance, and scalable environment for building modern, cloud-native applications.                                                  |
| **Framework**    | ASP.NET Core             | Used to build a **RESTful API** following **Clean Architecture** principles, separating concerns into Domain, Application, Infrastructure, and API layers.        |
| **Database**     | Baserow (Self-Hosted)    | Chosen as the primary NoSQL database for operational data, including the immutable audit log and user management, ensuring data sovereignty.                     |
| **Authentication** | JWT-Based Authentication | Implements a custom JSON Web Token (JWT) based authentication system for securing API endpoints, with Role-Based Access Control (RBAC) for authorization.    |
| **File Storage** | Not Implemented (Future) | Future implementation will consider services like Azure Blob Storage or AWS S3 for file and image uploads.                                                         |
| **External Services** | Google Gemini API        | Integrates with Google's Gemini large language model to power the **M2: Decision Engine**, providing advanced analytical and de-biasing capabilities.        |
| **API Docs**     | Swagger / OpenAPI        | Automatically generates interactive API documentation from the C# controllers and models, ensuring that the API contract is always up-to-date and easy to explore. |

2\. Frontend Architecture (Website & Portal)

| Component | Selection | Rationale / Details |
| :---- | :---- | :---- |
| **Framework** | Next.js / React | Provides a high-performance environment, supporting server-side rendering (SSR) and static site generation for SEO and speed. |
| **State Management** | **TanStack Query** | **Mandatory Integration:** Systematically replaced traditional useEffect and useState for all data fetching across major modules (content, users, companies, tasks). It provides robust caching, automatic state synchronization, and simplified logic. |
| **Deployment** | Firebase Hosting | The **Final Production Architecture** adopted after the strategic pivot from the complex GCP Load Balancer setup. Leverages a serverless model for reliability, security, and minimal overhead. |
| **Notifications** | Sonner | Fully migrated from shadcn/ui's useToast to provide a more consistent and feature-rich global notification system. |

Part II: DevOps and Technical Workflow

The workflow is established to enforce industry-standard Continuous Integration/Continuous Deployment (CI/CD) and ensure code quality and stability.1. Professional Website Update Workflow

* **Objective:** Establish an automated, secure, and reliable workflow for all website modifications to increase development velocity and reduce human error, replacing the manual Cloud Shell process.  
* **Pipeline:** **Git, GitHub, and Firebase Hosting.**  
* **Process:** Any approved change to the website's source code in the GitHub repository automatically triggers a deployment to the live production site (koruimpact.org).

2\. Secrets Management Strategy

* **Objective:** Utilize a cost-effective workflow that ensures security by adopting a 6-secret limit (Google Secret Manager free tier) as the single source of truth.  
* **Strategy:** Adopt a **3+3 JSON Object Model** (3 for Dev, 3 for Prod) to group related keys and minimize the number of secrets:  
  * **Public Config:** A single JSON object (dev-public-config) containing all variables safe for client-side exposure (e.g., NEXT\_PUBLIC\_API\_URL, Firebase client config).  
  * **Server Config:** A JSON object for server-side secrets (e.g., API keys, database credentials).

Part III: API & Data Model Specifications (Key Features)1. Content Liking System

* **Data Model:** The Content schema is updated to include a likeCount field for atomic tracking of likes.  
* **Endpoints:**  
  * **Like/Unlike:** POST /content/{id}/like \- Toggles a like on a piece of content (accessible to all roles).  
  * **List Liked Content:** GET /content/liked \- Requires authentication and returns the content liked by the authenticated user.  
* **Technical Fix:** Route order was corrected to define /content/liked before /:id to prevent incorrect routing (404 errors).

2\. About Us System

* **Goal:** Allow admin and superadmin users to create and manage professional profiles for a public "About Us" page.  
* **Access Control:** Role-based flow ensures admins can only view/edit their own profile, while superadmins can manage all profiles.  
* **Database Schema:** Extends the existing users collection with an optional aboutUsProfile field, which includes:  
  * role, jobTitle, bio, specializations.  
  * contactInfo (email, phone, website).  
  * isVisible (Boolean to control public display).

Part IV: Key Technical Projects & Debriefs1. Client Insights Portal MVP

* **Purpose:** To serve as the primary digital interface for delivering analytical findings to clients, acting as the secure and tangible manifestation of the value proposition.  
* **Justification:** Creates competitive differentiation from competitors who rely on standard PDF/email reports and is a cornerstone of **Strategy 1.68**.  
* **User Personas (MVP Scope):** Admin Operator, Client User, and Admin Analyst.

2\. koruimpact.org Static Site Deployment Post-Mortem

* **Initial Failure:** Cascading failures encountered during the implementation of a GCP Load Balancer.  
* **Strategic Pivot:** Successful final architecture shifted to **Firebase Hosting** for a serverless, managed-service model, prioritizing reliability and minimal operational overhead.  
* **Key Learning:** The resolution of the final redirect issue was achieved via code-based configuration, which is now adopted as a guiding principle for future infrastructure projects.

3\. Baserow Deployment Debrief

* **Goal:** Deploy a stable, secure, self-hosted instance of the Baserow no-code platform on GCP.  
* **Challenge:** The process was complex, involving extensive troubleshooting on a standard e2-medium virtual machine running Ubuntu 24.04 LTS and Docker for containerization.  
* **Status:** Fully operational and securely accessible at https://baserow.koruimpact.org.

Sources:

* [Koru Impact](https://drive.google.com/open?id=0AMlN-_Dhl9fVUk9PVA)