using KDSA.Application.Interfaces;
using KDSA.Infrastructure.Services;
using Swashbuckle.AspNetCore.Swagger;

var builder = WebApplication.CreateBuilder(args);

// --- 1. CORS AYARI (Frontend Erişimi İçin Kritik) ---
// React/Next.js uygulamanızın (localhost:5173 veya 3000) bu API'ye erişmesine izin verir.
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy =>
        {
            policy.WithOrigins("http://localhost:5173", "http://localhost:3000") // Frontend portları
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

// --- 2. SERVİS KAYITLARI (Dependency Injection) ---

// Standart Controller servisi
builder.Services.AddControllers();

// Swagger / OpenAPI (Test arayüzü için)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// M2: Decision Engine (Gemini AI Servisi)
builder.Services.AddScoped<IGeminiService, GeminiService>();

// M3: Alexandra (Compliance / Governance Servisi)
builder.Services.AddScoped<IAlexandraService, AlexandraService>();

// Infrastructure: Baserow Veritabanı İstemcisi
builder.Services.AddScoped<IBaserowClient, BaserowClient>();

// ACORE Modülü Servisi
builder.Services.AddScoped<IACOREService, ACOREService>();

// --- 3. UYGULAMA İNŞASI ---
var app = builder.Build();

// --- 4. MIDDLEWARE AYARLARI (İstek İşleme Hattı) ---

// Geliştirme ortamındaysak Swagger'ı aç
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// ÖNEMLİ: CORS middleware'i Authorization'dan ÖNCE gelmelidir.
app.UseCors("AllowReactApp");

app.UseAuthorization();

// Controller'ları (API uçlarını) haritala
app.MapControllers();

// Controller'ları haritalarken hata olursa detayını görmek için try-catch bloğu:
//try
//{
//    app.MapControllers();
//}
//catch (System.Reflection.ReflectionTypeLoadException ex)
//{
//    // Hatanın asıl sebebini konsola yazdırıyoruz
//    foreach (var item in ex.LoaderExceptions)
//    {
//        if (item != null)
//        {
//            System.Diagnostics.Debug.WriteLine($"KRİTİK HATA: {item.Message}");
//            Console.WriteLine($"KRİTİK HATA: {item.Message}");
//        }
//    }
//    throw; // Hatayı tekrar fırlat ki uygulama dursun biz de görelim
//}

// Uygulamayı başlat
app.Run();