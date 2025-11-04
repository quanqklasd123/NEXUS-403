// Dtos/CreateTodoListDTO.cs
using System.ComponentModel.DataAnnotations;

namespace TodoApi.Dtos
{
    // Chỉ chứa những gì ta CẦN để TẠO MỚI một List
    public class CreateTodoListDTO
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; }
    }
}