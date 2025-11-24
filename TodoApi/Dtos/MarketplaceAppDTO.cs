namespace TodoApi.Dtos
{
    public class MarketplaceAppDTO
    {
        public int Id { get; set; }
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
    }
}