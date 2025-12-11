# KDSA Teknik Mimari Kılavuzu (v1.0)

Bu klasör, Koru Karar-Bilim Mimarisi (KDSA) motorunun .NET 8.0 üzerinde "Clean Architecture" prensipleriyle nasıl inşa edildiğini katman katman açıklamaktadır. Her bir doküman, projenin belirli bir katmanını ve o katmanın sorumluluklarını detaylandırır.

## Dokümanlar

1.  **[KDSA.Domain Katmanı](./01-KDSA.Domain.md):** Projenin kalbi. İşin kurallarını, varlıklarını (Entities) ve dış dünyadan tamamen bağımsız, saf iş mantığını içerir.
2.  **[KDSA.Application Katmanı](./02-KDSA.Application.md):** İş akışlarını ve uygulama senaryolarını (Use Cases) tanımlar. Dış katmanların hangi işlevleri çağırabileceğini belirleyen arayüzleri (Interfaces) barındırır.
3.  **[KDSA.Infrastructure Katmanı](./03-KDSA.Infrastructure.md):** Dış dünya ile entegrasyonu sağlar. Veritabanı bağlantıları (Baserow), harici API'lar (Google Gemini) ve diğer altyapısal servislerin somut implementasyonlarını içerir.
4.  **[KDSA.API Katmanı](./04-KDSA.API.md):** Uygulamanın dış dünyaya açılan kapısıdır. İş ortaklarının (Partner) sistemi kullanabilmesi için RESTful API endpoint'lerini tanımlar.

## Mimari Akış (The Golden Thread)

Mimari, "Bağımlılık Kuralı" (The Dependency Rule) üzerine kuruludur. Bütün bağımlılıklar dış katmanlardan iç katmanlara doğrudur.

`API` -> `Infrastructure` -> `Application` -> `Domain`

-   **Domain:** Hiçbir katmana bağımlı değildir.
-   **Application:** Sadece Domain katmanına bağımlıdır.
-   **Infrastructure:** Application katmanındaki arayüzleri implemente ettiği için Application'a ve Domain'e bağımlıdır.
-   **API:** Kullanıcı isteklerini alıp Application katmanına yönlendirdiği için Application'a ve dolayısıyla diğer katmanlara bağımlıdır.

Bu yapı, projenin esnek, sürdürülebilir ve kolayca test edilebilir olmasını sağlar.
