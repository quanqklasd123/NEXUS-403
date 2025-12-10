namespace TodoApi.Dtos
{
    public class ProjectDTO
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; }
        public string? Description { get; set; }
        public string? JsonData { get; set; }
        public bool IsPublished { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}