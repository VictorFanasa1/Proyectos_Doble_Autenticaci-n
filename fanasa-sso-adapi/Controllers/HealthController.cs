using Microsoft.AspNetCore.Mvc;

namespace FanasaAdApi.Controllers
{
    [ApiController]
    [Route("api/health")]
    public class HealthController : ControllerBase
    {
        [HttpGet]
        public IActionResult Get() => Ok(new { status = "ok", service = "Fanasa AD API" });
    }
}
