using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using TeamTime.Api.Security;
using TeamTime.Api.Models;
using TeamTime.Api.Services;
using TeamTime.Api.Dtos;

namespace TeamTime.Api.Controllers;

[ApiController]
[Route("api/clients")]

public class ClientsController : ControllerBase
{
    private readonly ClientService _clientService;

    public ClientsController(ClientService clientService)
    {
        _clientService = clientService;
    }

    [HttpGet]
    public async Task<ActionResult<List<Client>>> GetAll()
    {
        var clients = await _clientService.GetAllAsync();

        return Ok(clients);
    }

    [HttpPost]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<Client>> Create(
    [FromBody] CreateClientRequest request)
    {
        var client = await _clientService.CreateAsync(request.Name);

        return CreatedAtAction(nameof(GetById),new { id = client.Id }, client);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Client>> GetById(int id)
    {
        var client = await _clientService.GetByIdAsync(id);

        if (client is null)
        {
            return NotFound();
        }

        return Ok(client);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<Client>> UpdateClient(
    int id,
    [FromBody] UpdateClientRequest request)
    {
        var client = await _clientService.UpdateAsync(id, request.Name);

        if (client is null)
        {
            return NotFound();
        }

        return Ok(client);
    }

    [HttpPatch("{id:int}/status")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<Client>> UpdateClientStatus(
    int id,
    [FromBody] UpdateClientStatusRequest request)
    {
        var client = await _clientService.UpdateStatusAsync(
            id,
            request.IsActive!.Value);

        if (client is null)
        {
            return NotFound();
        }

        return Ok(client);
    }
}