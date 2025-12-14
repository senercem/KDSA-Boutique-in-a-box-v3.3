# Layer 3: KDSA.Infrastructure

## 1. Overview

The `KDSA.Infrastructure` layer is where the application connects to the outside world. It contains the concrete implementations of the interfaces defined in the `KDSA.Application` layer. This is where technologies are chosen and implemented, such as which database to use, which AI model to call, and how to connect to external services.

**Responsibilities:**
-   Implement the interfaces from the `Application` layer (`IGeminiService`, `IAlexandraService`, `IBaserowClient`).
-   Handle all communication with external systems: databases, third-party APIs, file systems, etc.
-   Contain the "glue" code that connects the pure business logic to the outside world.
-   Manage configuration details (API keys, connection strings) needed to access external services.

## 2. Project Structure and Files

```
/src/KDSA.Infrastructure/
├── KDSA.Infrastructure.csproj
└── Services/
    ├── ACOREService.cs
    ├── AlexandraService.cs
    ├── AuthService.cs
    ├── BaserowClient.cs
    └── GeminiService.cs
```

### 2.1. `KDSA.Infrastructure.csproj`
This project file references both `KDSA.Application` (to access the interfaces it needs to implement) and `KDSA.Domain` (to work with the business entities). It also includes external library dependencies, such as `Newtonsoft.Json` for JSON serialization, `Microsoft.Extensions.Configuration` to read configuration values, `BCrypt.Net-Next` for password hashing, and `System.IdentityModel.Tokens.Jwt` for JWT token generation.

### 2.2. `Services/`
This directory contains the concrete classes that implement the application's interfaces.

-   **`ACOREService.cs`**: Implements `IACOREService`. It provides a simple in-memory implementation for calculating and storing `ACORERiskProfile` based on `ACOREInputData`.

-   **`AlexandraService.cs`**: Implements `IAlexandraService`.
    -   **Integration:** This service is now integrated with `IACOREService` to fetch the latest risk score and with `IBaserowClient` to log the complete `AuditLogEntry` to the database.
    -   `GenerateComplianceArtifactAsync`: This method constructs a full `ComplianceArtifact`, including data from M1 and M2, and logs the entire transaction to Baserow, creating a persistent audit trail.

-   **`AuthService.cs`**: Implements `IAuthService`.
    -   This service handles all user authentication and management logic.
    -   It connects to the Baserow API to store and retrieve user data from a dedicated `Users` table.
    -   It uses `BCrypt.Net-Next` to hash and verify passwords.
    -   It generates JWT tokens for authenticated users, including claims for username, email, and role.

-   **`BaserowClient.cs`**: Implements `IBaserowClient`.
    -   This class uses `HttpClient` to make REST API calls to the self-hosted Baserow instance.
    -   It reads the Baserow URL, API Token, and Table IDs from the configuration (`appsettings.json`).
    -   `LogDecisionAsync`: Serializes the `AuditLogEntry` object and sends it to the `KDSA_Audit_Log` table in Baserow.
    -   `GetAuditLogsAsync`: Retrieves all entries from the `KDSA_Audit_Log` table.

-   **`GeminiService.cs`**: Implements `IGeminiService`.
    -   This class also uses `HttpClient` to connect to the Google Gemini API.
    -   It retrieves the Gemini API key and base URL from the configuration.
    -   `AnalyzeRiskAsync`: This method constructs the JSON payload required by the Gemini API, sends the request, and then parses the response to extract just the generated text content. This encapsulates the complexity of the external API call.

## 3. Architectural Principles and Decisions

-   **Volatile Layer:** This layer is the most "volatile" or likely to change. By isolating this logic, we can change databases (from Baserow to PostgreSQL) or AI providers without touching the `Application` or `Domain` layers.
-   **Dependency Injection:** The services in this layer are designed to be registered with a dependency injection container. The `API` layer will ask for an `IGeminiService`, and the container will provide an instance of `GeminiService`. This decouples the layers at runtime.
-   **Configuration Management:** All secrets and environment-specific settings are managed through `IConfiguration`, which reads from `appsettings.json`. This keeps the code clean and secure.
