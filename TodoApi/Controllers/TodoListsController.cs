// Controllers/TodoListsController.cs
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
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class TodoListsController : ControllerBase
    {
        private readonly TodoContext _context;
        private readonly IMapper _mapper;

        public TodoListsController(TodoContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper; // <-- Khởi tạo
        }

        private string GetCurrentUserId()
        {
            // Lấy 'sub' (Subject) claim từ JWT Token
            return User.FindFirstValue(ClaimTypes.NameIdentifier);
        }

        // GET: api/TodoLists (CHỈ LẤY CỦA TÔI)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TodoListDTO>>> GetTodoLists()
        {
            var userId = GetCurrentUserId();

            var lists = await _context.TodoLists
                .Where(list => list.AppUserId == userId) // Lọc theo UserId
                .Include(list => list.Items) // <-- THÊM DÒNG NÀY ĐỂ LẤY CÁC ITEM CON
                .ToListAsync();

            return Ok(_mapper.Map<IEnumerable<TodoListDTO>>(lists));
        }
        // GET: api/TodoLists/5 (CHỈ LẤY CỦA TÔI)
        [HttpGet("{id}")]
        public async Task<ActionResult<TodoListDTO>> GetTodoList(long id)
        {
            var userId = GetCurrentUserId();

            var todoList = await _context.TodoLists
                .Include(list => list.Items)
                .FirstOrDefaultAsync(list => list.Id == id && list.AppUserId == userId); // <-- Kiểm tra quyền sở hữu

            if (todoList == null)
            {
                return NotFound(); // Không tìm thấy HOẶC không có quyền
            }

            return Ok(_mapper.Map<TodoListDTO>(todoList));
        }

        // POST: api/TodoLists (TỰ ĐỘNG GÁN USER)
        [HttpPost]
        public async Task<ActionResult<TodoListDTO>> PostTodoList(CreateTodoListDTO createDto)
        {
            var userId = GetCurrentUserId();

            var todoList = _mapper.Map<TodoList>(createDto);

            todoList.AppUserId = userId; // <-- Tự động gán người sở hữu

            _context.TodoLists.Add(todoList);
            await _context.SaveChangesAsync();

            var listDto = _mapper.Map<TodoListDTO>(todoList);

            return CreatedAtAction(nameof(GetTodoList), new { id = listDto.Id }, listDto);
        }

        // PUT: api/TodoLists/5 (PHẢI LÀ CỦA TÔI)
        [HttpPut("{id}")]
        public async Task<IActionResult> PutTodoList(long id, [FromBody] CreateTodoListDTO updateDto)
        {
            if (updateDto == null || string.IsNullOrWhiteSpace(updateDto.Name))
            {
                return BadRequest("Name is required");
            }

            var userId = GetCurrentUserId();

            var todoList = await _context.TodoLists
                .FirstOrDefaultAsync(list => list.Id == id && list.AppUserId == userId);

            if (todoList == null)
            {
                return NotFound();
            }

            todoList.Name = updateDto.Name;
            await _context.SaveChangesAsync();

            var listDto = _mapper.Map<TodoListDTO>(todoList);
            return Ok(listDto);
        }

        // DELETE: api/TodoLists/5 (PHẢI LÀ CỦA TÔI)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTodoList(long id)
        {
            var userId = GetCurrentUserId();

            var todoList = await _context.TodoLists
                .FirstOrDefaultAsync(list => list.Id == id && list.AppUserId == userId); // <-- Kiểm tra quyền sở hữu

            if (todoList == null)
            {
                return NotFound();
            }

            _context.TodoLists.Remove(todoList);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}