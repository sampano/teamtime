using Microsoft.EntityFrameworkCore;
using TeamTime.Api.Data;
using TeamTime.Api.Models;

namespace TeamTime.Api.Services;

public class ClientService
{
    private readonly AppDbContext _context;

    public ClientService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<Client>> GetAllAsync()
    {
        return await _context.Clients
            .AsNoTracking()
            .OrderBy(client => client.Name)
            .ToListAsync();
    }

    public async Task<Client> CreateAsync(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Client name is required.");
        }

        var trimmedName = name.Trim();

        if (trimmedName.Length > 200)
        {
            throw new ArgumentException(
                "Client name cannot exceed 200 characters.");
        }

        var client = new Client
        {
            Name = trimmedName
        };

        _context.Clients.Add(client);

        await _context.SaveChangesAsync();

        return client;
    }

    public async Task<Client?> GetByIdAsync(int id)
    {
        return await _context.Clients
            .AsNoTracking()
            .FirstOrDefaultAsync(client => client.Id == id);
    }

    public async Task<Client?> UpdateAsync(int id, string name)
    {
        var trimmedName = name.Trim();

        if (string.IsNullOrWhiteSpace(trimmedName))
        {
            throw new ArgumentException("Client name is required.");
        }

        if (trimmedName.Length > 200)
        {
            throw new ArgumentException(
                "Client name cannot exceed 200 characters.");
        }

        var client = await _context.Clients
            .FirstOrDefaultAsync(client => client.Id == id);

        if (client is null)
        {
            return null;
        }

        client.Name = trimmedName;

        await _context.SaveChangesAsync();

        return client;
    }

    public async Task<Client?> UpdateStatusAsync(int id, bool isActive)
    {
        var client = await _context.Clients
            .FirstOrDefaultAsync(client => client.Id == id);

        if (client is null)
        {
            return null;
        }

        client.IsActive = isActive;

        await _context.SaveChangesAsync();

        return client;
    }
}