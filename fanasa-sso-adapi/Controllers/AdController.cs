using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using FanasaAdApi.Services;

namespace FanasaAdApi.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/ad")]
    public class AdController : ControllerBase
    {
        private readonly AdService _adService;
        private readonly IHostEnvironment _env;

        public AdController(AdService adService, IHostEnvironment env)
        {
            _adService = adService;
            _env       = env;
        }

        /// <summary>
        /// GET /api/ad/user?email=victor.hernandez@gf.grupofarmacos.net
        /// GET /api/ad/user?email=victor.hernandez
        /// Devuelve datos de AD del usuario (sin contraseña, usa cuenta de servicio).
        /// </summary>
        [HttpGet("user")]
        public IActionResult GetUser([FromQuery] string? email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return BadRequest(new { error = "El parámetro 'email' es requerido." });

            var (info, errorMsg) = _adService.GetUserByEmail(email);

            if (info == null)
            {
                // En desarrollo mostramos el error real para facilitar debugging
                var detail = _env.IsDevelopment() ? errorMsg : null;
                return NotFound(new { error = "Usuario no encontrado en Active Directory.", detail });
            }

            return Ok(new
            {
                employee_number = info.EmployeeNumber,
                name            = info.Name,
                area            = info.Area,
                manager         = info.Manager,
                job_title       = info.JobTitle,  // ← nuevo campo
            });
        }
    }
}
