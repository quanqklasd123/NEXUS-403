// Controllers/TodoItemsController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TodoApi.Data;
using TodoApi.Models;
using AutoMapper;
using TodoApi.Dtos;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace TodoApi.Controllers
{
    [Route("api/[controller]")] // Đường dẫn sẽ là /api/todoitems
    [ApiController]
    [Authorize]
    public class TodoItemsController : ControllerBase
    {
        private readonly TodoContext _context;
        private readonly IMapper _mapper;

        // Tiêm AutoMapper
        public TodoItemsController(TodoContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper; // <-- Khởi tạo
        }

        private string GetCurrentUserId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier);
        }

        // GET: api/TodoItems (Trả về DTO)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TodoItemDTO>>> GetTodoItems()
        {
            var todoItems = await _context.TodoItems.ToListAsync();
            // Map sang DTO
            return Ok(_mapper.Map<IEnumerable<TodoItemDTO>>(todoItems));
        }

        // GET: api/TodoItems/5 (Trả về DTO)
        [HttpGet("{id}")]
        public async Task<ActionResult<TodoItemDTO>> GetTodoItem(long id)
        {
            var todoItem = await _context.TodoItems.FindAsync(id);
            if (todoItem == null)
            {
                return NotFound();
            }
            // Map sang DTO
            return Ok(_mapper.Map<TodoItemDTO>(todoItem));
        }

        // POST: api/TodoItems (KIỂM TRA QUYỀN TRÊN LIST)
        [HttpPost]
        public async Task<ActionResult<TodoItemDTO>> PostTodoItem(CreateTodoItemDTO createDto)
        {
            var userId = GetCurrentUserId();

            // Kiểm tra xem List (mà user muốn thêm item vào) có thuộc về user này không
            var listExists = await _context.TodoLists
                .AnyAsync(list => list.Id == createDto.TodoListId && list.AppUserId == userId);

            if (!listExists)
            {
                // Nếu List không tồn tại, hoặc không phải của user
                return Forbid(); // Lỗi 403 Forbidden
            }

            // Nếu ổn, tiếp tục tạo item
            var todoItem = _mapper.Map<TodoItem>(createDto);

            _context.TodoItems.Add(todoItem);
            await _context.SaveChangesAsync();

            var todoItemDto = _mapper.Map<TodoItemDTO>(todoItem);

            return CreatedAtAction(nameof(GetTodoItem), new { id = todoItemDto.Id }, todoItemDto);
        }

        // PUT: api/TodoItems/5 (NHẬN VÀO DTO)
        [HttpPut("{id}")]
        public async Task<IActionResult> PutTodoItem(long id, CreateTodoItemDTO updateDto)
        {
            // (Chúng ta đang tạm dùng CreateTodoItemDTO cho cả PUT)
            var todoItemFromDb = await _context.TodoItems.FindAsync(id);
            if (todoItemFromDb == null)
            {
                return NotFound();
            }

            // Ma thuật của AutoMapper: Cập nhật todoItemFromDb bằng dữ liệu từ updateDto
            _mapper.Map(updateDto, todoItemFromDb);
            
            // Không cần dòng này nữa: _context.Entry(todoItemFromDb).State = EntityState.Modified;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/TodoItems/5 (XÓA)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTodoItem(long id)
        {
            // Tìm item dựa trên ID
            var todoItem = await _context.TodoItems.FindAsync(id);
            if (todoItem == null)
            {
                // Nếu không tìm thấy, trả về 404
                return NotFound();
            }

            // Lệnh xóa (chưa thực thi)
            _context.TodoItems.Remove(todoItem);
            
            // Thực thi lệnh xóa và lưu thay đổi vào CSDL
            await _context.SaveChangesAsync();

            // Trả về 204 No Content
            return NoContent();
        }
    }
}