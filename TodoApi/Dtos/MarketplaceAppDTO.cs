namespace TodoApi.Dtos
{
    public class MarketplaceAppDTO
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; }
        public string Description { get; set; }
        public string Author { get; set; }
        public string Category { get; set; } // Danh mục: Template (Mẫu), Module (Mô-đun)...
        public string[] Tags { get; set; }
        public string Downloads { get; set; }
        public double Rating { get; set; }
        public string Color { get; set; } // Màu sắc: sage (xanh xám), peach (cam), butter (vàng)...
        public bool IsInstalled { get; set; }
        public string? Price { get; set; } // null = Miễn phí (Free)
        // Dữ liệu JSON của app (cây component) khi nguồn là Project đã publish (xuất bản)
        public string? JsonData { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}