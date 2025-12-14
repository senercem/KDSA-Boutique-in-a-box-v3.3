# KDSA Technical Architecture Guide (v1.0)

This directory provides a layer-by-layer explanation of how the Koru Decision-Science Architecture (KDSA) engine is built using Clean Architecture principles on .NET 8.0. Each document details a specific layer of the project and its responsibilities.

## Documents

1.  **[Layer 1: KDSA.Domain](./01-KDSA.Domain.md):** The heart of the project. It contains the core business rules, entities, and the pure business logic, completely independent of the outside world.
2.  **[Layer 2: KDSA.Application](./02-KDSA.Application.md):** Defines the business workflows and use cases. It holds the interfaces that determine which functions the outer layers can invoke.
3.  **[Layer 3: KDSA.Infrastructure](./03-KDSA.Infrastructure.md):** Manages integration with the outside world. It contains the concrete implementations for database connections (Baserow), external APIs (Google Gemini), and other infrastructural services.
4.  **[Layer 4: KDSA.API](./04-KDSA.API.md):** The entry point to the application from the outside world. It defines the RESTful API endpoints for partners to consume the system's capabilities.

## Architectural Flow (The Golden Thread)

The architecture is founded on "The Dependency Rule." All dependencies flow from the outer layers inward.

`API` -> `Infrastructure` -> `Application` -> `Domain`

-   **Domain:** Depends on no other layer.
-   **Application:** Depends only on the Domain layer.
-   **Infrastructure:** Depends on Application (by implementing its interfaces) and Domain.
-   **API:** Depends on Application to forward user requests, and consequently on the other layers.

This structure ensures the project is flexible, maintainable, and easily testable.
