# Layer 2: KDSA.Application

## 1. Overview

The `KDSA.Application` layer acts as the orchestrator of the business logic. It defines the application's use cases and specifies *what* the system can do, but not *how* it does it. This is achieved through interfaces that decouple the core application logic from the external infrastructure (like databases or APIs).

**Responsibilities:**
-   Define interfaces (`IGeminiService`, `IAlexandraService`, `IBaserowClient`) that represent contracts for external services.
-   Contain the application-specific business rules and logic.
-   Orchestrate data flow between the Domain and Infrastructure layers.
-   Remain independent of UI, databases, and other external concerns.

## 2. Project Structure and Files

```
/src/KDSA.Application/
├── KDSA.Application.csproj
├── DTOs/
│   ├── AuthDtos.cs
│   └── ReportGenerationDto.cs
└── Interfaces/
    ├── IACOREService.cs
    ├── IAlexandraService.cs
    ├── IAuthService.cs
    ├── IBaserowClient.cs
    └── IGeminiService.cs
```

### 2.1. `KDSA.Application.csproj`
This file specifies that the project is built with .NET and, crucially, holds a reference to the `KDSA.Domain` project. This is because the application layer must know about the core business entities to orchestrate them.

### 2.2. `DTOs/`
This directory contains Data Transfer Objects (DTOs). DTOs are used to shape the data that is sent to and from the API layer, preventing the direct exposure of domain entities and providing a clear contract for API consumers.

-   **`AuthDtos.cs`**: Contains DTOs for authentication and user management, such as `RegisterDto`, `LoginDto`, `AuthResponseDto`, `ChangePasswordDto`, and `UserDto`.
-   **`ReportGenerationDto.cs`**: A DTO used for the compliance report generation endpoint, carrying the `SystemId`, `M2AnalysisResult`, and `M1RiskScore`.

### 2.3. `Interfaces/`
This directory contains the contracts (C# interfaces) that the `Infrastructure` layer must implement. This is a core principle of Clean Architecture: the `Application` layer dictates the rules, and the `Infrastructure` layer provides the implementation.

-   **`IACOREService.cs`**: Defines the contract for **M1: ACORE**. It specifies functions to analyze human-factor data and retrieve the latest risk profile for a given system.

-   **`IAlexandraService.cs`**: Defines the contract for **M3: Project Alexandra**. It specifies three core functions required for AI governance:
    1.  `RegisterSystemContextAsync`: To map and register an AI system's context.
    2.  `IngestMetricsAsync`: To measure and ingest a model's performance metrics.
    3.  `GenerateComplianceArtifactAsync`: To manage and generate a compliance report for partners, automating Third-Party Risk Management (TPRM).
    4.  `GetFullAuditTrailAsync`: To retrieve the complete audit log from the database.

-   **`IAuthService.cs`**: Defines the contract for authentication and user management. It includes methods for user registration, login, changing passwords, getting all users, and deleting a user.

-   **`IBaserowClient.cs`**: Defines the contract for communicating with the Baserow database. It contains methods for:
    1.  `LogDecisionAsync`: To write an `AuditLogEntry` to the immutable audit log.
    2.  `GetAuditLogsAsync`: To retrieve all audit logs.

-   **`IGeminiService.cs`**: Defines the contract for **M2: The Decision Engine**. It specifies one primary function:
    1.  `AnalyzeRiskAsync`: To send a text prompt (representing a decision context) to the Gemini AI for analysis and receive the result.

## 3. Architectural Principles and Decisions

-   **The Dependency Rule:** This layer depends only on the `Domain` layer. It has no knowledge of the `Infrastructure` or `API` layers.
-   **Interface-Based:** The use of interfaces is critical. It allows the `Infrastructure` layer to be completely swapped out without affecting the `Application` layer. For example, we could switch from Google Gemini to another AI provider by simply creating a new implementation of `IGeminiService`.
-   **Data Transfer Objects (DTOs):** DTOs are used to create a stable contract for the API, insulating it from changes in the internal domain models. This prevents breaking changes for API consumers.
-   **No External Libraries:** Like the Domain layer, this layer should avoid direct dependencies on external libraries related to databases, web frameworks, or other infrastructure concerns. Its focus is pure application logic.
