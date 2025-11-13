// TodoApi/Dtos/DashboardStatsDTO.cs
namespace TodoApi.Dtos
{
    public class DashboardStatsDTO
    {
        public int TotalLists { get; set; }
        public int TotalTasks { get; set; }
        public int CompletedTasks { get; set; }
    }
}