namespace TodoApi.Dtos
{
    public class MarketplaceAppDTO
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; }
        public string Description { get; set; }
        public string Author { get; set; }
        public string Category { get; set; } // Template, Module...
        public string[] Tags { get; set; }
        public string Downloads { get; set; }
        public double Rating { get; set; }
        public string Color { get; set; } // sage, peach, butter...
        public bool IsInstalled { get; set; }
        public string? Price { get; set; } // null = Free
        // JSON data of the app (component tree) when source is a published Project
        public string? JsonData { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}