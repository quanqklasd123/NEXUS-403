// TodoApi/Dtos/UpdateItemStatusDTO.cs
using System.ComponentModel.DataAnnotations;

namespace TodoApi.Dtos
{
    public class UpdateItemStatusDTO
    {
        [Range(0, 2)] // Chỉ cho phép 0 (To Do), 1 (In Progress), hoặc 2 (Done)
        public int Status { get; set; }
    }
}