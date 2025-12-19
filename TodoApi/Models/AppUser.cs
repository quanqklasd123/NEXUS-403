// Models/AppUser.cs
using Microsoft.AspNetCore.Identity;

namespace TodoApi.Models
{
    // Kế thừa (inherit) từ IdentityUser để có sẵn các trường (fields)
    // Email, PasswordHash, UserName, PhoneNumber, và nhiều trường khác
    public class AppUser : IdentityUser
    {
        public ICollection<TodoList> TodoLists { get; set; } = new List<TodoList>();
    }
}