// Controllers/TodoItemsController.cs
//using Microsoft.AspNetCore.JsonPatch;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TodoApi.Data;
using TodoApi.Models;
using AutoMapper;
using TodoApi.Dtos;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using TodoApi.Services;


namespace TodoApi.Controllers
{
    [Route("api/[controller]")] // Đường dẫn sẽ là /api/todoitems
    [ApiController]
    [Authorize]
    public class TodoItemsController : ControllerBase
    {
        private readonly TodoContext _context;
        private readonly IMapper _mapper;
        private readonly IGoogleCalendarEventService _calendarEventService;
        private readonly ILogger<TodoItemsController> _logger;

        // Tiêm AutoMapper và Google Calendar Event Service
        public TodoItemsController(
            TodoContext context, 
            IMapper mapper,
            IGoogleCalendarEventService calendarEventService,
            ILogger<TodoItemsController> logger)
        {
            _context = context;
            _mapper = mapper;
            _calendarEventService = calendarEventService;
            _logger = logger;
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

            // Lấy TodoList để có tên category
            var todoList = await _context.TodoLists
                .FirstOrDefaultAsync(list => list.Id == createDto.TodoListId && list.AppUserId == userId);
            
            if (todoList == null)
            {
                return Forbid();
            }

            // Nếu ổn, tiếp tục tạo item
            var todoItem = _mapper.Map<TodoItem>(createDto);

            _context.TodoItems.Add(todoItem);
            await _context.SaveChangesAsync();

            // Tự động tạo Google Calendar event nếu có dueDate
            if (createDto.DueDate.HasValue && !string.IsNullOrEmpty(todoItem.Title))
            {
                try
                {
                    await _calendarEventService.CreateCalendarEventAsync(
                        userId,
                        todoItem.Id,
                        todoItem.Title,
                        null, // Description có thể thêm sau
                        createDto.DueDate.Value,
                        todoList.Name
                    );
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to create Google Calendar event for task {TaskId}, continuing anyway", todoItem.Id);
                }
            }

            // Reload để có TodoListName
            await _context.Entry(todoItem).Reference(i => i.TodoList).LoadAsync();
            var todoItemDto = _mapper.Map<TodoItemDTO>(todoItem);

            return CreatedAtAction(nameof(GetTodoItem), new { id = todoItemDto.Id }, todoItemDto);
        }

        // PUT: api/TodoItems/5 (NHẬN VÀO DTO)
        [HttpPut("{id}")]
        public async Task<IActionResult> PutTodoItem(long id, CreateTodoItemDTO updateDto)
        {
            var userId = GetCurrentUserId();

            // (Chúng ta đang tạm dùng CreateTodoItemDTO cho cả PUT)
            var todoItemFromDb = await _context.TodoItems
                .Include(item => item.TodoList)
                .FirstOrDefaultAsync(item => item.Id == id);

            if (todoItemFromDb == null)
            {
                return NotFound();
            }

            // Kiểm tra quyền sở hữu
            if (todoItemFromDb.TodoList.AppUserId != userId)
            {
                return Forbid();
            }

            // Lưu dueDate cũ để so sánh
            var oldDueDate = todoItemFromDb.DueDate;
            var categoryName = todoItemFromDb.TodoList.Name;

            // Ma thuật của AutoMapper: Cập nhật todoItemFromDb bằng dữ liệu từ updateDto
            _mapper.Map(updateDto, todoItemFromDb);

            // Không cần dòng này nữa: _context.Entry(todoItemFromDb).State = EntityState.Modified;

            await _context.SaveChangesAsync();

            // Tự động update/delete Google Calendar event
            try
            {
                await _calendarEventService.UpdateCalendarEventAsync(
                    userId,
                    id,
                    todoItemFromDb.Title ?? "Untitled Task",
                    null,
                    todoItemFromDb.DueDate,
                    categoryName
                );
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to update Google Calendar event for task {TaskId}, continuing anyway", id);
            }

            return NoContent();
        }

        // DELETE: api/TodoItems/5 (XÓA)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTodoItem(long id)
        {
            var userId = GetCurrentUserId();

            // Tìm item dựa trên ID
            var todoItem = await _context.TodoItems
                .Include(item => item.TodoList)
                .FirstOrDefaultAsync(item => item.Id == id);
            
            if (todoItem == null)
            {
                // Nếu không tìm thấy, trả về 404
                return NotFound();
            }

            // Kiểm tra quyền sở hữu
            if (todoItem.TodoList.AppUserId != userId)
            {
                return Forbid();
            }

            // Xóa Google Calendar event trước khi xóa task
            try
            {
                await _calendarEventService.DeleteCalendarEventAsync(userId, id);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to delete Google Calendar event for task {TaskId}, continuing anyway", id);
            }

            // Lệnh xóa (chưa thực thi)
            _context.TodoItems.Remove(todoItem);

            // Thực thi lệnh xóa và lưu thay đổi vào CSDL
            await _context.SaveChangesAsync();

            // Trả về 204 No Content
            return NoContent();
        }

        // GET: api/todoitems/my-all
        [HttpGet("my-all")]
        public async Task<ActionResult<IEnumerable<TodoItemDTO>>> GetAllMyItems()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var items = await _context.TodoItems
                // 1. Chỉ lấy item CỦA TÔI
                .Where(item => item.TodoList.AppUserId == userId)

                // 2. Lấy kèm thông tin của List (để AutoMapper lấy được Tên)
                .Include(item => item.TodoList)

                .OrderByDescending(item => item.Priority) // Sắp xếp theo ưu tiên
                .ToListAsync();

            // 3. AutoMapper sẽ tự động "dịch" (map) sang DTO
            return Ok(_mapper.Map<IEnumerable<TodoItemDTO>>(items));
        }

        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateItemStatus(long id, [FromBody] UpdateItemStatusDTO statusDto)
        {
            // (Chúng ta có thể kiểm tra quyền sở hữu ở đây nếu muốn)
            var todoItem = await _context.TodoItems.FindAsync(id);
            if (todoItem == null)
            {
                return NotFound();
            }

            // Cập nhật chỉ 1 trường
            todoItem.Status = statusDto.Status;
            await _context.SaveChangesAsync();

            return NoContent(); // 204 No Content
        }


    }
}