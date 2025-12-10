// Profiles/MappingProfile.cs
using AutoMapper;
using TodoApi.Dtos;
using TodoApi.Models;

namespace TodoApi.Profiles
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // Nguồn (Source) -> Đích (Destination)

            // 1. Ánh xạ cho List
            CreateMap<TodoList, TodoListDTO>(); // GET
            CreateMap<CreateTodoListDTO, TodoList>(); // POST

            // 2. Ánh xạ cho Item
            // Note: TodoListName sẽ được set thủ công trong controllers vì MongoDB không có navigation properties
            CreateMap<TodoItem, TodoItemDTO>(); // GET
            CreateMap<CreateTodoItemDTO, TodoItem>(); // POST

            // 3. Ánh xạ cho PUT (Cập nhật)
            // Chúng ta có thể tạo UpdateTodoItemDTO riêng,
            // nhưng tạm thời có thể dùng CreateTodoItemDTO cho cả PUT
            // UpdateTodoItemDTO -> TodoItem
            CreateMap<CreateTodoItemDTO, TodoItem>(); 
        }
    }
}