// Controllers/GoogleCalendarController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TodoApi.Services;

namespace TodoApi.Controllers
{
    [ApiController]
    [Route("api/google-calendar")]
    [Authorize]
    public class GoogleCalendarController : ControllerBase
    {
        private readonly IGoogleCalendarService _googleCalendarService;
        private readonly ILogger<GoogleCalendarController> _logger;
        private readonly IConfiguration _configuration;

        public GoogleCalendarController(
            IGoogleCalendarService googleCalendarService,
            ILogger<GoogleCalendarController> logger,
            IConfiguration configuration)
        {
            _googleCalendarService = googleCalendarService;
            _logger = logger;
            _configuration = configuration;
        }

        private string GetUserId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier) 
                ?? throw new UnauthorizedAccessException("User ID not found");
        }

        // GET: api/google-calendar/auth-url
        [HttpGet("auth-url")]
        public async Task<IActionResult> GetAuthUrl()
        {
            try
            {
                var userId = GetUserId();
                var authUrl = await _googleCalendarService.GetAuthorizationUrlAsync(userId);
                return Ok(new { authUrl });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating Google Calendar auth URL");
                return StatusCode(500, new { message = "Failed to generate authorization URL" });
            }
        }

        // GET: api/google-calendar/callback?code={code}&state={state}&error={error}
        [HttpGet("callback")]
        [AllowAnonymous] // Cho phép không cần auth vì Google redirect về đây
        public async Task<IActionResult> Callback(
            [FromQuery] string? code, 
            [FromQuery] string? state,
            [FromQuery] string? error,
            [FromQuery] string? error_description)
        {
            var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:5173";

            try
            {
                // Xử lý lỗi từ Google OAuth
                if (!string.IsNullOrEmpty(error))
                {
                    _logger.LogWarning("OAuth error from Google: {Error}, Description: {Description}", 
                        error, error_description);
                    
                    // Redirect về frontend với thông tin lỗi
                    var errorParam = Uri.EscapeDataString(error);
                    var errorDescParam = !string.IsNullOrEmpty(error_description) 
                        ? Uri.EscapeDataString(error_description) 
                        : "";
                    
                    if (!string.IsNullOrEmpty(errorDescParam))
                    {
                        return Redirect($"{frontendUrl}/settings?google-calendar-error={errorParam}&error-description={errorDescParam}");
                    }
                    else
                    {
                        return Redirect($"{frontendUrl}/settings?google-calendar-error={errorParam}");
                    }
                }

                // Kiểm tra authorization code
                if (string.IsNullOrEmpty(code))
                {
                    _logger.LogWarning("Callback received without authorization code");
                    return Redirect($"{frontendUrl}/settings?google-calendar-error=missing_code");
                }

                // Kiểm tra state parameter
                if (string.IsNullOrEmpty(state))
                {
                    _logger.LogWarning("Callback received without state parameter");
                    return Redirect($"{frontendUrl}/settings?google-calendar-error=missing_state");
                }

                // Decode userId từ state
                string userId;
                try
                {
                    var stateBytes = Convert.FromBase64String(state);
                    userId = System.Text.Encoding.UTF8.GetString(stateBytes);
                    
                    if (string.IsNullOrEmpty(userId))
                    {
                        _logger.LogWarning("Decoded state is empty");
                        return Redirect($"{frontendUrl}/settings?google-calendar-error=invalid_state");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error decoding state parameter: {State}", state);
                    return Redirect($"{frontendUrl}/settings?google-calendar-error=invalid_state");
                }

                // Xử lý OAuth callback
                _logger.LogInformation("Processing OAuth callback for user: {UserId}", userId);
                var success = await _googleCalendarService.HandleCallbackAsync(userId, code);

                if (success)
                {
                    _logger.LogInformation("Google Calendar connection successful for user: {UserId}", userId);
                    return Redirect($"{frontendUrl}/settings?google-calendar-connected=true");
                }
                else
                {
                    _logger.LogWarning("Failed to handle Google Calendar callback for user: {UserId}", userId);
                    return Redirect($"{frontendUrl}/settings?google-calendar-error=callback_failed");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error handling Google Calendar callback");
                return Redirect($"{frontendUrl}/settings?google-calendar-error=server_error");
            }
        }

        // GET: api/google-calendar/status
        [HttpGet("status")]
        public async Task<IActionResult> GetStatus()
        {
            try
            {
                var userId = GetUserId();
                var status = await _googleCalendarService.GetConnectionStatusAsync(userId);

                if (status == null)
                {
                    return Ok(new { isConnected = false });
                }

                return Ok(new
                {
                    isConnected = status.IsConnected,
                    connectedAt = status.ConnectedAt,
                    expiresAt = status.ExpiresAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting Google Calendar connection status");
                return StatusCode(500, new { message = "Failed to get connection status" });
            }
        }

        // DELETE: api/google-calendar/disconnect
        [HttpDelete("disconnect")]
        public async Task<IActionResult> Disconnect()
        {
            try
            {
                var userId = GetUserId();
                var success = await _googleCalendarService.DisconnectAsync(userId);

                if (success)
                {
                    return Ok(new { message = "Google Calendar disconnected successfully" });
                }
                else
                {
                    return BadRequest(new { message = "Failed to disconnect Google Calendar" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error disconnecting Google Calendar");
                return StatusCode(500, new { message = "Failed to disconnect Google Calendar" });
            }
        }
    }
}

