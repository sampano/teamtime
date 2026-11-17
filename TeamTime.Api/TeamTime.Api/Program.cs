using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using TeamTime.Api.Data;
using TeamTime.Api.Models;
using TeamTime.Api.Services;
using TeamTime.Api.Security;

var builder = WebApplication.CreateBuilder(args);

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

    options.ExpireTimeSpan = TimeSpan.FromHours(8);
    options.SlidingExpiration = true;

    options.EventsType = typeof(ActiveUserCookieEvents);
});

builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-CSRF-TOKEN";
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi().AllowAnonymous();
    app.MapScalarApiReference().AllowAnonymous();

    //gives the seeder access to scoped services, including the database context
    await using var scope = app.Services.CreateAsyncScope();

    await IdentitySeeder.SeedRolesAsync(
        scope.ServiceProvider);

    await IdentitySeeder.SeedAdminAsync(
        scope.ServiceProvider,
        app.Configuration);
}

app.UseHttpsRedirection();

//identifies the user from their cookie.
app.UseAuthentication();
//checks what that user can access.
app.UseAuthorization();

// Connect controller routes to the application.
app.MapControllers();

app.Run();
