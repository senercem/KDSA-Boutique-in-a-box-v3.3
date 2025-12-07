# Katman 1: KDSA.Domain

## 1. Genel Bakış

`KDSA.Domain`, projenin merkezinde yer alan, en saf ve en korunaklı katmandır. Bu katman, Koru Impact'in iş kurallarını ve kavramlarını kodda temsil eden varlıkları (Entities) içerir. "Clean Architecture" prensiplerine göre, bu katman başka hiçbir katmana bağımlı değildir ve dış dünyadaki teknolojik değişikliklerden (veritabanı, UI, framework'ler) etkilenmez.

**Sorumlulukları:**
-   Saf iş varlıklarını (Entities) tanımlamak.
-   Uygulama genelindeki temel veri yapılarını ve modellerini belirlemek.
-   Projenin "ne yaptığıyla" ilgili kuralları içermek, "nasıl yaptığıyla" ilgilenmemek.

## 2. Proje Yapısı ve Dosyalar

```
/src/KDSA.Domain/
├── KDSA.Domain.csproj
└── Entities/
    ├── AlexandraModels.cs
    └── BaserowEntities.cs
```

### 2.1. `KDSA.Domain.csproj`
Bu dosya, projenin .NET 8.0 ile derlendiğini ve temel proje bağımlılıklarını tanımlar. Bu katmanın tek görevi model tanımlamak olduğu için harici bir kütüphane bağımlılığı bulunmaz.

### 2.2. `Entities/AlexandraModels.cs`
Bu dosya, projenin **M3: Project Alexandra (Yönetişim Katmanı)** modülüyle ilgili veri yapılarını içerir. Bu modeller, AI sistemlerinin yönetişimi ve DORA/EU AI Act gibi regülasyonlara uyumluluk için gerekli olan veri giriş ve çıkışlarını tanımlar.

-   **`AISystemContext`**: Bir yapay zeka sisteminin bağlamını (niyeti, kullanım ortamı, veri kaynakları, sahibi vb.) tanımlayan ana model. Bu, "MAP" fonksiyonunun temel girdisidir.
-   **`DataSourceInfo`**: `AISystemContext` içinde kullanılan, veri kaynaklarının detaylarını (tipi, hacmi, PII içerip içermediği) belirten yardımcı model.
-   **`ModelMetric`**: Bir modelin performans metriklerini (doğruluk, F1 skoru vb.) ve eşik durumunu taşıyan model. Bu, "MEASURE" fonksiyonunun temel girdisidir.
-   **`ComplianceArtifact`**: Sistemin bir iş ortağına sunacağı, denetlenebilir uyumluluk raporunun formatını tanımlayan model. Bu, "MANAGE" fonksiyonunun çıktısıdır.
-   **`RiskControl`**: `ComplianceArtifact` içinde yer alan, belirli bir risk kategorisine karşı uygulanan kontrolleri ve durumunu özetleyen model.

### 2.3. `Entities/BaserowEntities.cs`
Bu dosya, projenin operasyonel veritabanı olan Baserow tablolarıyla eşleşen veri yapılarını içerir.

-   **`AuditLogEntry`**: KDSA'in "Golden Thread" akışındaki her bir kararın ve işlemin değiştirilemez kaydını (immutable log) tutmak için tasarlanmış model. Baserow'daki `KDSA_Audit_Log` tablosuna karşılık gelir. Bu model, M1, M2 ve M3 modüllerinden gelen verileri tek bir yerde birleştirir.
-   **`RegulatoryMatrixItem`**: Hangi regülasyonun (örn: "EU AI Act"), hangi maddesinin (örn: "Article 14"), KDSA'in hangi kontrolüyle (örn: "M1->M2 Pre-Mortem Loop") karşılandığını haritalayan teorik bir model. Bu, denetim süreçlerini otomatize etmek için kullanılır.

## 3. Mimari İlkeler ve Kararlar

-   **Bağımsızlık:** Bu katman, `System` gibi temel .NET kütüphaneleri dışında hiçbir şeye referans vermez. `Newtonsoft.Json` veya `Microsoft.Extensions` gibi paketler burada asla yer almamalıdır.
-   **POCO (Plain Old CLR Objects):** Buradaki sınıflar, karmaşık mantık içermeyen, sadece veri taşıyan basit C# nesneleridir. Bu, katmanın saf ve test edilebilir kalmasını sağlar.
-   **İsimlendirme:** Sınıf ve property isimleri, doğrudan iş dünyasındaki kavramları yansıtmalıdır (Ubiquitous Language). Örneğin, `ComplianceArtifact` ismi, iş ortağına sunulan "Uyumluluk Raporu" kavramının koddaki karşılığıdır.
