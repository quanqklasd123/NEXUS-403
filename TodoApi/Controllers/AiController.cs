// Controllers/AiController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TodoApi.AI;
using TodoApi.AI.Models;

namespace TodoApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Yêu cầu người dùng phải đăng nhập
    public class AiController : ControllerBase
    {
        private readonly AiPredictionService _predictionService;

        // "Tiêm" Dịch vụ Dự đoán vào
        public AiController(AiPredictionService predictionService)
        {
            _predictionService = predictionService;
        }

        // POST: api/ai/suggest-priority
        [HttpPost("suggest-priority")]
        public IActionResult SuggestPriority([FromBody] TaskInput input)
        {
            if (string.IsNullOrEmpty(input.Title))
            {
                return BadRequest("Title không được để trống.");
            }

            try
            {
                // 1. Gọi "bộ não" để dự đoán
                var prediction = _predictionService.Predict(input);

                // 2. Trả về kết quả dự đoán
                // Chúng ta chỉ cần trả về Priority, không cần các thứ khác
                return Ok(new 
                { 
                    // "Priority" (dự đoán) đến từ lớp TaskPriorityPrediction
                    // (lưu ý: nó là float, ví dụ 2.0)
                    Priority = (int)Math.Round(prediction.Priority) 
                });
            }
            catch (Exception ex)
            {
                // (Nếu model.zip bị thiếu hoặc có lỗi)
                return StatusCode(500, $"Lỗi dự đoán AI: {ex.Message}");
            }
        }
    }
}