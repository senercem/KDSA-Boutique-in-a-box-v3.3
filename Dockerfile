# 1. AŞAMA: Build (Derleme) İşlemi
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Proje dosyalarını kopyala
COPY ["src/KDSA.API/KDSA.API.csproj", "src/KDSA.API/"]
COPY ["src/KDSA.Application/KDSA.Application.csproj", "src/KDSA.Application/"]
COPY ["src/KDSA.Domain/KDSA.Domain.csproj", "src/KDSA.Domain/"]
COPY ["src/KDSA.Infrastructure/KDSA.Infrastructure.csproj", "src/KDSA.Infrastructure/"]
COPY ["src/KDSA.Core/KDSA.Core.csproj", "src/KDSA.Core/"]

# Bağımlılıkları yükle (Restore)
RUN dotnet restore "src/KDSA.API/KDSA.API.csproj"

# Tüm kodları kopyala ve derle
COPY . .
WORKDIR "/src/src/KDSA.API"
RUN dotnet build "KDSA.API.csproj" -c Release -o /app/build

# Yayınla (Publish)
FROM build AS publish
RUN dotnet publish "KDSA.API.csproj" -c Release -o /app/publish

# 2. AŞAMA: Runtime (Çalıştırma) İşlemi
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
EXPOSE 5050
ENV ASPNETCORE_URLS=http://+:5050

COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "KDSA.API.dll"]