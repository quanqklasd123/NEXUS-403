namespace TodoApi.Dtos
{
    public class PublishAppDTO
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public string Category { get; set; }
        public string? Price { get; set; }
        // Trong thực tế, bạn sẽ gửi cả cấu trúc JSON của App (canvasItems)
        // public string AppDataJson { get; set; } 
    }
}