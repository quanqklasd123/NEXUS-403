// TodoApi/AI/AiPredictionService.cs
using Microsoft.ML;
using TodoApi.AI.Models;

namespace TodoApi.AI
{
    public class AiPredictionService
    {
        private readonly MLContext _mlContext;
        private readonly string _modelZipPath;
        private readonly ITransformer _trainedModel; // Bộ não đã huấn luyện

        public AiPredictionService()
        {
            _mlContext = new MLContext(seed: 0);
            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            _modelZipPath = Path.Combine(baseDir, "AI", "model.zip");

            // --- TẢI "BỘ NÃO" (model.zip) ---
            // Tải mô hình đã được huấn luyện (chỉ 1 lần khi service khởi động)
            if (!File.Exists(_modelZipPath))
            {
                // Ném lỗi nếu chưa chạy huấn luyện
                throw new FileNotFoundException($"Không tìm thấy file mô hình tại: '{_modelZipPath}'. " +
                    $"Bạn đã chạy API 'GET /api/admin/train-ai' chưa?");
            }

            _trainedModel = _mlContext.Model.Load(_modelZipPath, out _);
        }

        // --- HÀM DỰ ĐOÁN ---
        public TaskPriorityPrediction Predict(TaskInput input)
        {
            // 1. Tạo "Cỗ máy Dự đoán"
            var predictionEngine = _mlContext.Model.CreatePredictionEngine<TaskInput, TaskPriorityPrediction>(_trainedModel);

            // 2. Đưa "input" vào và nhận "output"
            var prediction = predictionEngine.Predict(input);

            return prediction;
        }
    }
}