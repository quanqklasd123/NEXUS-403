// TodoApi/AI/AiModelService.cs
using Microsoft.ML;
using TodoApi.AI.Models;

namespace TodoApi.AI
{
    public class AiModelService
    {
        private readonly MLContext _mlContext;
        private readonly string _dataCsvPath;
        private readonly string _modelZipPath;

        public AiModelService()
        {
            _mlContext = new MLContext(seed: 0); 
            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            _dataCsvPath = Path.Combine(baseDir, "AI", "task-data.csv");
            _modelZipPath = Path.Combine(baseDir, "AI", "model.zip");
        }

        public bool TrainAndSaveModel()
        {
            try
            {
                // 1. TẢI DỮ LIỆU "THỨC ĂN" (TỪ CSV)
                IDataView trainingData = _mlContext.Data.LoadFromTextFile<TaskInput>(
                    _dataCsvPath, 
                    hasHeader: true, 
                    separatorChar: ',');

                // 2. XÂY DỰNG "CÔNG THỨC" (PIPELINE)
                var pipeline = 
                    // Bước A: Chuyển cột "Priority" (0,1,2) thành một "Key" (Label)
                    _mlContext.Transforms.Conversion.MapValueToKey(
                        inputColumnName: "Priority", 
                        outputColumnName: "Label") 
                    
                    // Bước B: Chuyển cột "Title" (text) thành một "Vector" (số)
                    .Append(_mlContext.Transforms.Text.FeaturizeText(
                        inputColumnName: "Title", 
                        outputColumnName: "TitleFeaturized")) 
                    
                    // Bước C: Gộp tất cả các cột input ("TitleFeaturized")
                    .Append(_mlContext.Transforms.Concatenate(
                        "Features", 
                        "TitleFeaturized"))
                    
                    // Bước D: Chọn thuật toán AI để huấn luyện
                    // (Đầu ra của bước này LUÔN LÀ "PredictedLabel")
                    .Append(_mlContext.MulticlassClassification.Trainers.SdcaMaximumEntropy(
                        "Label", 
                        "Features"))

                    // Chuyển "Label" đã dự đoán (PredictedLabel)
                    // trở lại thành số (0,1,2) và đặt tên là "PredictedPriority"
                    .Append(_mlContext.Transforms.Conversion.MapKeyToValue(
                        outputColumnName: "PredictedPriority", // <-- output trước
                        inputColumnName: "PredictedLabel"));  // <-- input sau

                // 3. HUẤN LUYỆN
                var model = pipeline.Fit(trainingData);

                // 4. LƯU "BỘ NÃO"
                _mlContext.Model.Save(model, trainingData.Schema, _modelZipPath);

                return true;
            }
            catch (Exception ex)
            {
                // In lỗi "thật" ra terminal
                Console.WriteLine($"--- LỖI HUẤN LUYỆN AI THẬT ---");
                Console.WriteLine(ex.ToString());
                Console.WriteLine($"--- KẾT THÚC LỖI ---");
                return false;
            }
        }
    }
}