namespace TodoApi.Dtos
{
    public class CategoryDTO
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; }
        public string? Description { get; set; }
        public string Color { get; set; }
        public DateTime CreatedAt { get; set; }
        public string CreatedBy { get; set; }
    }

    public class CreateCategoryDTO
    {
        public string Name { get; set; }
        public string? Description { get; set; }
        public string Color { get; set; } = "sage";
    }
}

