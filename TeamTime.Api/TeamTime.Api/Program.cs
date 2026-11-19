using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Net;
using Scalar.AspNetCore;
using TeamTime.Api.Data;
using TeamTime.Api.Models;
using TeamTime.Api.Services;
using TeamTime.Api.Security;

var builder = WebApplication.CreateBuilder(args);

if (builder.Environment.IsProduction())
{
    builder.Services.AddDataProtection()
        .PersistKeysToFileSystem(
            new DirectoryInfo("/app/keys"))
        .SetApplicationName("TeamTime");
}

if (builder.Environment.IsProduction())
{
    builder.Services.Configure<ForwardedHeadersOptions>(options =>
    {
        options.ForwardedHeaders =
            ForwardedHeaders.XForwardedFor |
            ForwardedHeaders.XForwardedProto;

        // Trust only the dedicated Nginx proxy.
        options.KnownProxies.Add(
            IPAddress.Parse(
                builder.Configuration["ReverseProxy:NginxProxy"]
                ?? throw new InvalidOperationException(
                    "Nginx proxy IP address is not configured.")));

        options.ForwardLimit = 1;
    });
}

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

// Register controllers and adds global antiforgery filter.
builder.Services.AddControllersWithViews(options =>
{
    options.Filters.Add(
        new AutoValidateAntiforgeryTokenAttribute());
});

//sets the default authorization rule: user must be signed in.
//applies when an endpoint has no explicit authorization policy. [Authorize] and [AutoValidateAntiforgeryToken]
builder.Services.AddAuthorizationBuilder()
    .SetFallbackPolicy(
        new AuthorizationPolicyBuilder()
            .RequireAuthenticatedUser()
            .Build());


builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("UserDatabase")
        ?? throw new InvalidOperationException(
            "Connection string 'UserDatabase' was not found.")
    ));

builder.Services.AddScoped<ClientService>();

//egisters account management, password hashing, roles, and cookie authentication
builder.Services
    .AddIdentity<ApplicationUser, IdentityRole>(options =>
    {
        options.User.RequireUniqueEmail = true;

        options.Password.RequiredLength = 12;
        options.Password.RequireDigit = true;
        options.Password.RequireLowercase = true;
        options.Password.RequireUppercase = true;
        options.Password.RequireNonAlphanumeric = true;
    })
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

builder.Services.AddScoped<MemberService>();

builder.Services.AddScoped<ActiveUserCookieEvents>();

builder.Services.AddScoped<TimeEntryService>();

builder.Services.AddScoped<TimerService>();

builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.HttpOnly = true;

    options.Cookie.SecurePolicy =
        builder.Environment.IsProduction()
            ? CookieSecurePolicy.Always
            : CookieSecurePolicy.SameAsRequest;

    options.ExpireTimeSpan = TimeSpan.FromHours(8);
    options.SlidingExpiration = true;

    options.EventsType = typeof(ActiveUserCookieEvents);
});

builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-CSRF-TOKEN";

    options.Cookie.SecurePolicy =
        builder.Environment.IsProduction()
            ? CookieSecurePolicy.Always
            : CookieSecurePolicy.SameAsRequest;
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi().AllowAnonymous();
    app.MapScalarApiReference().AllowAnonymous();
}

// Initialize the database
await using (var scope = app.Services.CreateAsyncScope())
{
    var db = scope.ServiceProvider
        .GetRequiredService<AppDbContext>();

    Console.WriteLine("Starting database migration...");

    await db.Database.MigrateAsync();

    Console.WriteLine("Database migration completed successfully.");

    await IdentitySeeder.SeedRolesAsync(
        scope.ServiceProvider);

    await IdentitySeeder.SeedAdminAsync(
        scope.ServiceProvider,
        app.Configuration);

    Console.WriteLine("Identity initialization completed successfully.");
}

if (app.Environment.IsProduction())
{
    app.UseForwardedHeaders();
}

app.UseHttpsRedirection();

//identifies the user from their cookie.
app.UseAuthentication();
//checks what that user can access.
app.UseAuthorization();

// Connect controller routes to the application.
app.MapControllers();

app.MapGet("/", () => "TeamTime API is running.")
    .AllowAnonymous();

app.Run();
