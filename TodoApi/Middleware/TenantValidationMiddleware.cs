using TodoApi.Helpers;
using System.Security.Claims;

namespace TodoApi.Middleware
{
    /// <summary>
    /// Middleware để validate AppId trong requests và verify ownership
    /// </summary>
    public class TenantValidationMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<TenantValidationMiddleware> _logger;

        public TenantValidationMiddleware(RequestDelegate next, ILogger<TenantValidationMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context, TenantSecurityHelper securityHelper)
        {
            // Lấy AppId từ query string hoặc route
            var appId = context.Request.Query["appId"].FirstOrDefault() 
                       ?? context.Request.RouteValues["appId"]?.ToString();

            // Lấy userId từ JWT token
            var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!string.IsNullOrWhiteSpace(appId) && !string.IsNullOrWhiteSpace(userId))
            {
                // Validate AppId format
                if (!securityHelper.IsValidObjectId(appId))
                {
                    _logger.LogWarning("Invalid AppId format in request: {AppId}, Path: {Path}", appId, context.Request.Path);
                    context.Response.StatusCode = 400;
                    await context.Response.WriteAsJsonAsync(new { 
                        message = "Invalid AppId format" 
                    });
                    return;
                }

                // Verify ownership
                var isOwned = await securityHelper.VerifyAppOwnershipAsync(appId, userId);
                
                // Store in HttpContext for controllers to use
                context.Items["AppId"] = appId;
                context.Items["AppOwned"] = isOwned;

                if (!isOwned)
                {
                    _logger.LogWarning("Unauthorized AppId access attempt: AppId={AppId}, UserId={UserId}, Path={Path}", 
                        appId, userId, context.Request.Path);
                    context.Response.StatusCode = 403;
                    await context.Response.WriteAsJsonAsync(new { 
                        message = "You don't have access to this app" 
                    });
                    return;
                }
            }
            else if (!string.IsNullOrWhiteSpace(appId))
            {
                // AppId provided but no userId (not authenticated)
                context.Items["AppId"] = appId;
                context.Items["AppOwned"] = false;
            }

            await _next(context);
        }
    }

    /// <summary>
    /// Extension method để register middleware
    /// </summary>
    public static class TenantValidationMiddlewareExtensions
    {
        public static IApplicationBuilder UseTenantValidation(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<TenantValidationMiddleware>();
        }
    }
}
