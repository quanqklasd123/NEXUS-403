// TodoApi/AI/Models/TaskPriorityPrediction.cs
using Microsoft.ML.Data;

namespace TodoApi.AI.Models
{
    // Đây là kết quả (đầu ra) sau khi AI dự đoán
    public class TaskPriorityPrediction
    {
        // Đây là cột dự đoán (dạng "Key") mà Trainer (bộ huấn luyện) tạo ra
        [ColumnName("PredictedLabel")] 
        public uint PredictedKey { get; set; }

        // Đây là cột cuối cùng (dạng "float") sau khi
        // chúng ta chuyển đổi "PredictedLabel"
        // Chúng ta đặt tên nó là "PredictedPriority" để tránh va chạm tên
        [ColumnName("PredictedPriority")]
        public float Priority { get; set; }
    }
}