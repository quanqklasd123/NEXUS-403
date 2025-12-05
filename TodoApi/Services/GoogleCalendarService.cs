// Services/GoogleCalendarService.cs
using Google.Apis.Auth.OAuth2;
using Google.Apis.Auth.OAuth2.Flows;
using Google.Apis.Auth.OAuth2.Responses;
using Google.Apis.Calendar.v3;
using Google.Apis.Services;
using Microsoft.EntityFrameworkCore;
using TodoApi.Data;
using TodoApi.Models;

namespace TodoApi.Services
{
    public class GoogleCalendarService : IGoogleCalendarService
    {
        private readonly TodoContext _context;
        private readonly IConfiguration _configuration;
        private readonly ILogger<GoogleCalendarService> _logger;

        public GoogleCalendarService(
            TodoContext context,
            IConfiguration configuration,
            ILogger<GoogleCalendarService> logger)
        {
            _context = context;
            _configuration = configuration;
            _logger = logger;
        }

        private string GetClientId() => _configuration["GoogleCalendar:ClientId"] ?? throw new InvalidOperationException("GoogleCalendar:ClientId not configured");
        private string GetClientSecret() => _configuration["GoogleCalendar:ClientSecret"] ?? throw new InvalidOperationException("GoogleCalendar:ClientSecret not configured");
        private string GetRedirectUri() => _configuration["GoogleCalendar:RedirectUri"] ?? throw new InvalidOperationException("GoogleCalendar:RedirectUri not configured");
        private string[] GetScopes()
        {
            var scopes = _configuration.GetSection("GoogleCalendar:Scopes").Get<string[]>();
            return scopes ?? new[] { 
                "https://www.googleapis.com/auth/calendar",
                "https://www.googleapis.com/auth/calendar.events"
            };
        }

        public async Task<string> GetAuthorizationUrlAsync(string userId)
        {
            var clientSecrets = new ClientSecrets
            {
                ClientId = GetClientId(),
                ClientSecret = GetClientSecret()
            };

            var flow = new GoogleAuthorizationCodeFlow(new GoogleAuthorizationCodeFlow.Initializer
            {
                ClientSecrets = clientSecrets,
                Scopes = GetScopes()
            });

            // Tạo state để verify callback (bao gồm userId)
            var state = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(userId));

            var request = flow.CreateAuthorizationCodeRequest(GetRedirectUri());
            var uri = request.Build();
            
            // Add state parameter manually
            var uriBuilder = new UriBuilder(uri);
            var query = uriBuilder.Query;
            if (!string.IsNullOrEmpty(query) && query.StartsWith("?"))
                query = query.Substring(1);
            
            var queryParams = new List<string>();
            if (!string.IsNullOrEmpty(query))
                queryParams.AddRange(query.Split('&'));
            
            queryParams.Add($"state={Uri.EscapeDataString(state)}");
            uriBuilder.Query = string.Join("&", queryParams);

            return uriBuilder.ToString();
        }

        public async Task<bool> HandleCallbackAsync(string userId, string code)
        {
            try
            {
                var clientSecrets = new ClientSecrets
                {
                    ClientId = GetClientId(),
                    ClientSecret = GetClientSecret()
                };

                var flow = new GoogleAuthorizationCodeFlow(new GoogleAuthorizationCodeFlow.Initializer
                {
                    ClientSecrets = clientSecrets,
                    Scopes = GetScopes()
                });

                // Exchange authorization code for tokens
                var tokenResponse = await flow.ExchangeCodeForTokenAsync(
                    userId,
                    code,
                    GetRedirectUri(),
                    CancellationToken.None);

                // Lưu hoặc cập nhật token vào database
                var existingToken = await _context.GoogleCalendarTokens
                    .FirstOrDefaultAsync(t => t.AppUserId == userId);

                // Calculate expiration time from ExpiresInSeconds
                var expiresAt = DateTime.UtcNow.AddSeconds(tokenResponse.ExpiresInSeconds ?? 3600); // Default 1 hour

                if (existingToken != null)
                {
                    // Update existing token
                    existingToken.AccessToken = tokenResponse.AccessToken;
                    existingToken.RefreshToken = tokenResponse.RefreshToken ?? existingToken.RefreshToken;
                    existingToken.TokenType = tokenResponse.TokenType;
                    existingToken.ExpiresAt = expiresAt;
                    existingToken.Scope = string.Join(" ", GetScopes());
                    existingToken.UpdatedAt = DateTime.UtcNow;
                }
                else
                {
                    // Create new token
                    var newToken = new GoogleCalendarToken
                    {
                        AppUserId = userId,
                        AccessToken = tokenResponse.AccessToken,
                        RefreshToken = tokenResponse.RefreshToken,
                        TokenType = tokenResponse.TokenType ?? "Bearer",
                        ExpiresAt = expiresAt,
                        Scope = string.Join(" ", GetScopes()),
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _context.GoogleCalendarTokens.Add(newToken);
                }

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error handling Google Calendar OAuth callback for user {UserId}", userId);
                return false;
            }
        }

        public async Task<string> GetValidAccessTokenAsync(string userId)
        {
            var token = await _context.GoogleCalendarTokens
                .FirstOrDefaultAsync(t => t.AppUserId == userId);

            if (token == null)
                throw new InvalidOperationException("Google Calendar not connected");

            // Check if token is expired
            if (token.ExpiresAt <= DateTime.UtcNow)
            {
                await RefreshAccessTokenAsync(userId);
                // Reload token after refresh
                token = await _context.GoogleCalendarTokens
                    .FirstOrDefaultAsync(t => t.AppUserId == userId);
            }

            return token?.AccessToken ?? throw new InvalidOperationException("Failed to get access token");
        }

        public async Task<bool> RefreshAccessTokenAsync(string userId)
        {
            try
            {
                var token = await _context.GoogleCalendarTokens
                    .FirstOrDefaultAsync(t => t.AppUserId == userId);

                if (token == null || string.IsNullOrEmpty(token.RefreshToken))
                    return false;

                var clientSecrets = new ClientSecrets
                {
                    ClientId = GetClientId(),
                    ClientSecret = GetClientSecret()
                };

                var flow = new GoogleAuthorizationCodeFlow(new GoogleAuthorizationCodeFlow.Initializer
                {
                    ClientSecrets = clientSecrets,
                    Scopes = GetScopes()
                });

                var tokenResponse = await flow.RefreshTokenAsync(
                    userId,
                    token.RefreshToken,
                    CancellationToken.None);

                // Calculate expiration time from ExpiresInSeconds
                var expiresAt = DateTime.UtcNow.AddSeconds(tokenResponse.ExpiresInSeconds ?? 3600); // Default 1 hour

                // Update token
                token.AccessToken = tokenResponse.AccessToken;
                if (!string.IsNullOrEmpty(tokenResponse.RefreshToken))
                    token.RefreshToken = tokenResponse.RefreshToken;
                token.ExpiresAt = expiresAt;
                token.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error refreshing Google Calendar token for user {UserId}", userId);
                return false;
            }
        }

        public async Task<GoogleCalendarConnectionStatus?> GetConnectionStatusAsync(string userId)
        {
            var token = await _context.GoogleCalendarTokens
                .FirstOrDefaultAsync(t => t.AppUserId == userId);

            if (token == null)
                return new GoogleCalendarConnectionStatus { IsConnected = false };

            return new GoogleCalendarConnectionStatus
            {
                IsConnected = true,
                ConnectedAt = token.CreatedAt,
                ExpiresAt = token.ExpiresAt
            };
        }

        public async Task<bool> DisconnectAsync(string userId)
        {
            try
            {
                var token = await _context.GoogleCalendarTokens
                    .FirstOrDefaultAsync(t => t.AppUserId == userId);

                if (token == null)
                    return false;

                // Revoke token với Google (optional, có thể skip nếu lỗi)
                try
                {
                    var clientSecrets = new ClientSecrets
                    {
                        ClientId = GetClientId(),
                        ClientSecret = GetClientSecret()
                    };
                    var flow = new GoogleAuthorizationCodeFlow(new GoogleAuthorizationCodeFlow.Initializer
                    {
                        ClientSecrets = clientSecrets
                    });
                    await flow.RevokeTokenAsync(userId, token.AccessToken, CancellationToken.None);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to revoke Google token (continuing with deletion)");
                }

                // Xóa token khỏi database
                _context.GoogleCalendarTokens.Remove(token);

                // Xóa tất cả calendar events của user (sẽ implement trong Phase 3)
                var userTodoItems = await _context.TodoItems
                    .Where(item => item.TodoList != null && item.TodoList.AppUserId == userId)
                    .Select(item => item.Id)
                    .ToListAsync();

                var calendarEvents = await _context.TaskCalendarEvents
                    .Where(e => userTodoItems.Contains(e.TodoItemId))
                    .ToListAsync();

                _context.TaskCalendarEvents.RemoveRange(calendarEvents);

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error disconnecting Google Calendar for user {UserId}", userId);
                return false;
            }
        }
    }
}

