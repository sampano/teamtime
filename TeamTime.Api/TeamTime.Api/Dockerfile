FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY TeamTime.Api.csproj ./
RUN dotnet restore TeamTime.Api.csproj

COPY . .
RUN dotnet publish TeamTime.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://0.0.0.0:3000
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 3000

ENTRYPOINT ["dotnet", "TeamTime.Api.dll"]