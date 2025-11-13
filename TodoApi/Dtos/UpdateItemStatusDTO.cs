// TodoApi/Dtos/UpdateItemStatusDTO.cs
using System.ComponentModel.DataAnnotations;

namespace TodoApi.Dtos
{
    public class UpdateItemStatusDTO
    {
        [Range(0, 2)] // Chỉ cho phép 0, 1, hoặc 2
        public int Status { get; set; }
    }
}