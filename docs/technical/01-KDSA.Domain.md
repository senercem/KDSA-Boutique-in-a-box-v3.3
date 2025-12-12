# Layer 1: KDSA.Domain

## 1. Overview

`KDSA.Domain` is the centermost, purest, and most protected layer of the project. This layer contains the entities that represent Koru Impact's business rules and concepts in code. According to Clean Architecture principles, this layer is not dependent on any other layer and is unaffected by technological changes in the outside world (e.g., databases, UI, frameworks).

**Responsibilities:**
-   To define pure business entities.
-   To establish the core data structures and models used throughout the application.
-   To contain the rules related to *what* the project does, not *how* it does it.

## 2. Project Structure and Files

```
/src/KDSA.Domain/
├── KDSA.Domain.csproj
└── Entities/
    ├── ACOREModels.cs
    ├── AlexandraModels.cs
    ├── BaserowEntities.cs
    └── User.cs
```

### 2.1. `KDSA.Domain.csproj`
This file defines that the project is compiled with .NET 8.0 and specifies its base dependencies. As this layer's sole purpose is to define models, it has no external library dependencies.

### 2.2. `Entities/ACOREModels.cs`
This file contains the data structures for **M1: ACORE (Sensing Layer)**. These models define the inputs from human-factor analysis and the resulting risk profile.

-   **`ACOREInputData`**: Represents the raw data coming from the frontend, capturing metrics like psychological safety, change fatigue, role clarity, and leadership trust.
-   **`ACORERiskProfile`**: Represents the calculated risk profile based on the input data. It includes an overall risk score, a risk level (e.g., Low, Medium, High), and a list of critical breaches.

### 2.3. `Entities/AlexandraModels.cs`
This file contains the data structures related to **M3: Project Alexandra (The Governance Layer)**. These models define the necessary data inputs and outputs for the governance of AI systems and compliance with regulations like DORA and the EU AI Act.

-   **`AISystemContext`**: The primary model that defines the context of an AI system (its intended use, deployment environment, data sources, owner, etc.). This is the main input for the "MAP" function.
-   **`DataSourceInfo`**: A helper model used within `AISystemContext` to specify details of data sources (type, volume, whether it contains PII).
-   **`ModelMetric`**: A model that carries the performance metrics of a model (e.g., accuracy, F1-score) and its threshold status. This is the main input for the "MEASURE" function.
-   **`ComplianceArtifact`**: The model that defines the format of the auditable compliance report the system will provide to a partner. This is the output of the "MANAGE" function.
-   **`RiskControl`**: A model within `ComplianceArtifact` that summarizes the controls implemented for a specific risk category and their status.

### 2.4. `Entities/BaserowEntities.cs`
This file contains data structures that map directly to tables in Baserow, the project's operational database.

-   **`AuditLogEntry`**: This model is designed to hold the immutable record of every decision and action in KDSA's "Golden Thread" flow. It corresponds to the `KDSA_Audit_Log` table in Baserow and consolidates data from the M1, M2, and M3 modules.
-   **`RegulatoryMatrixItem`**: A theoretical model used to map which regulation (e.g., "EU AI Act") and which article (e.g., "Article 14") is addressed by which KDSA control (e.g., "M1->M2 Pre-Mortem Loop"). This is used to automate audit processes.

### 2.5. `Entities/User.cs`
This file contains the `User` entity, which represents a user in the system.

-   **`User`**: The model for a user, containing properties like `Id`, `Username`, `Email`, `PasswordHash`, `Role`, and `CreatedDate`. This entity is used for authentication and authorization.

## 3. Architectural Principles and Decisions

-   **Independence:** This layer does not reference anything besides core .NET libraries like `System`. Packages such as `Newtonsoft.Json` or `Microsoft.Extensions` should never be included here.
-   **POCO (Plain Old CLR Objects):** The classes here are simple C# objects that only carry data and contain no complex logic. This keeps the layer pure and testable.
-   **Naming:** Class and property names should directly reflect business concepts (Ubiquitous Language). For example, the name `ComplianceArtifact` is the code representation of the "Compliance Report" concept provided to partners.
