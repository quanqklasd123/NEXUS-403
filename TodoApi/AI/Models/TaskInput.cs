// TodoApi/AI/Models/TaskInput.cs
using Microsoft.ML.Data; // Cần "using" thư viện ML

namespace TodoApi.AI.Models
{
    // Đây là cấu trúc của file CSV (đầu vào)
    public class TaskInput
    {
        // Cột 0 trong CSV
        [LoadColumn(0)]
        public string Title { get; set; }

        // Cột 1 trong CSV, đây là "Label" (đáp án) mà AI cần học
        [LoadColumn(1)]
        public float Priority { get; set; } // Phải là float cho ML.NET
    }
}