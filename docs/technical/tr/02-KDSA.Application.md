# Katman 2: KDSA.Application

## 1. Genel Bakış

`KDSA.Application` katmanı, iş mantığının orkestrasyonunu yapan katmandır. Uygulamanın kullanım senaryolarını (use cases) tanımlar ve sistemin *ne yapabildiğini* belirtir, ancak bunu *nasıl yaptığıyla* ilgilenmez. Bu, temel uygulama mantığını veritabanları veya harici API'lar gibi dış altyapıdan ayıran arayüzler (interfaces) aracılığıyla sağlanır.

**Sorumlulukları:**
-   Harici servisler için sözleşmeleri temsil eden arayüzleri (`IGeminiService`, `IAlexandraService`, `IBaserowClient`) tanımlamak.
-   Uygulamaya özgü iş kurallarını ve mantığını içermek.
-   Domain ve Infrastructure katmanları arasındaki veri akışını yönetmek.
-   Kullanıcı arayüzü, veritabanları ve diğer dış etkenlerden bağımsız kalmak.

## 2. Proje Yapısı ve Dosyalar

```
/src/KDSA.Application/
├── KDSA.Application.csproj
└── Interfaces/
    ├── IAlexandraService.cs
    ├── IBaserowClient.cs
    └── IGeminiService.cs
```

### 2.1. `KDSA.Application.csproj`
Bu dosya, projenin .NET ile derlendiğini ve en önemlisi `KDSA.Domain` projesine bir referans içerdiğini belirtir. Bunun nedeni, uygulama katmanının temel iş varlıklarını yönetebilmesi için onları tanıması gerektiğidir.

### 2.2. `Interfaces/`
Bu klasör, `Infrastructure` katmanının uygulaması gereken sözleşmeleri (C# arayüzleri) içerir. Bu, Clean Architecture'ın temel bir prensibidir: `Application` katmanı kuralları koyar, `Infrastructure` katmanı ise bu kuralların implementasyonunu sağlar.

-   **`IAlexandraService.cs`**: **M3: Project Alexandra** için sözleşmeyi tanımlar. AI yönetişimi için gerekli üç temel işlevi belirtir:
    1.  `RegisterSystemContextAsync`: Bir AI sisteminin bağlamını haritalamak ve kaydetmek.
    2.  `IngestMetricsAsync`: Bir modelin performans metriklerini ölçmek ve içeri almak.
    3.  `GenerateComplianceArtifactAsync`: İş ortakları için bir uyumluluk raporu oluşturarak Üçüncü Parti Risk Yönetimi'ni (TPRM) otomatize etmek.

-   **`IBaserowClient.cs`**: Baserow veritabanı ile iletişimin sözleşmesini tanımlar. Tek bir metot içerir:
    1.  `LogDecisionAsync`: "Golden Thread" mimarisinin merkezinde yer alan, değiştirilemez denetim kaydına bir `AuditLogEntry` yazmak.

-   **`IGeminiService.cs`**: **M2: Karar Motoru** için sözleşmeyi tanımlar. Bir ana işlevi belirtir:
    1.  `AnalyzeRiskAsync`: Bir karar bağlamını temsil eden bir metin istemini (prompt) analiz için Gemini AI'a göndermek ve sonucu almak.

## 3. Mimari İlkeler ve Kararlar

-   **Bağımlılık Kuralı:** Bu katman yalnızca `Domain` katmanına bağımlıdır. `Infrastructure` veya `API` katmanları hakkında hiçbir bilgisi yoktur.
-   **Arayüz Tabanlı:** Arayüzlerin kullanımı kritiktir. `Infrastructure` katmanının, `Application` katmanını etkilemeden tamamen değiştirilebilmesini sağlar. Örneğin, sadece `IGeminiService` için yeni bir implementasyon oluşturarak Google Gemini'den başka bir AI sağlayıcısına geçiş yapabiliriz.
-   **Harici Kütüphane Yok:** Domain katmanı gibi, bu katman da veritabanları, web framework'leri veya diğer altyapısal konularla ilgili harici kütüphanelere doğrudan bağımlılıklardan kaçınmalıdır. Odak noktası saf uygulama mantığıdır.
-   **Veri Aktarım Nesneleri (DTOs):** Mevcut basit yapıda açıkça kullanılmasa da, daha karmaşık bir uygulamada bu katman, API ve Uygulama katmanları arasında veri aktarmak için DTO'ları kullanabilir. Bu, iş varlıklarının doğrudan dışarıya açılmasını önler.
