// Controllers/TodoItemsController.cs
using Microsoft.AspNetCore.Mvc;
using TodoApi.Data;
using TodoApi.Models;
using AutoMapper;
using TodoApi.Dtos;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using MongoDB.Driver;

namespace TodoApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class TodoItemsController : ControllerBase
    {
        private readonly MongoDbContext _mongoContext;
        private readonly IMapper _mapper;
        private readonly ILogger<TodoItemsController> _logger;

        public TodoItemsController(
            MongoDbContext mongoContext, 
            IMapper mapper,
            ILogger<TodoItemsController> logger)
        {
            _mongoContext = mongoContext;
            _mapper = mapper;
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
            var todoItems = await _mongoContext.TodoItems.Find(_ => true).ToListAsync();
            var itemDtos = new List<TodoItemDTO>();
            
            foreach (var item in todoItems)
            {
                var list = await _mongoContext.TodoLists.Find(l => l.Id == item.TodoListId).FirstOrDefaultAsync();
                itemDtos.Add(new TodoItemDTO
                {
                    Id = item.Id,
                    Title = item.Title,
                    Status = item.Status,
                    Priority = item.Priority,
                    DueDate = item.DueDate,
                    TodoListId = item.TodoListId,
                    TodoListName = list?.Name
                });
            }
            
            return Ok(itemDtos);
        }

        // GET: api/TodoItems/5 (Trả về DTO)
        [HttpGet("{id}")]
        public async Task<ActionResult<TodoItemDTO>> GetTodoItem(string id)
        {
            var filter = Builders<TodoItem>.Filter.Eq(item => item.Id, id);
            var todoItem = await _mongoContext.TodoItems.Find(filter).FirstOrDefaultAsync();
            
            if (todoItem == null)
            {
                return NotFound();
            }
            
            var list = await _mongoContext.TodoLists.Find(l => l.Id == todoItem.TodoListId).FirstOrDefaultAsync();
            var itemDto = new TodoItemDTO
            {
                Id = todoItem.Id,
                Title = todoItem.Title,
                Status = todoItem.Status,
                Priority = todoItem.Priority,
                DueDate = todoItem.DueDate,
                TodoListId = todoItem.TodoListId,
                TodoListName = list?.Name
            };
            
            return Ok(itemDto);
        }

        // POST: api/TodoItems (KIỂM TRA QUYỀN TRÊN LIST)
        [HttpPost]
        public async Task<ActionResult<TodoItemDTO>> PostTodoItem(CreateTodoItemDTO createDto)
        {
            try
            {
                var userId = GetCurrentUserId();
                
                if (string.IsNullOrEmpty(userId))
                {
                    _logger.LogWarning("User ID not found in token");
                    return Unauthorized(new { message = "User ID not found in token" });
                }

                if (string.IsNullOrWhiteSpace(createDto.Title))
                {
                    return BadRequest(new { message = "Title is required" });
                }

                if (string.IsNullOrWhiteSpace(createDto.TodoListId))
                {
                    return BadRequest(new { message = "TodoListId is required" });
                }

                _logger.LogInformation("Creating todo item: Title={Title}, TodoListId={TodoListId}, UserId={UserId}", 
                    createDto.Title, createDto.TodoListId, userId);

                // Kiểm tra xem List có thuộc về user này không
                var listFilter = Builders<TodoList>.Filter.And(
                    Builders<TodoList>.Filter.Eq(list => list.Id, createDto.TodoListId),
                    Builders<TodoList>.Filter.Eq(list => list.AppUserId, userId)
                );
                
                var todoList = await _mongoContext.TodoLists.Find(listFilter).FirstOrDefaultAsync();
                
                if (todoList == null)
                {
                    _logger.LogWarning("TodoList not found or access denied: TodoListId={TodoListId}, UserId={UserId}", 
                        createDto.TodoListId, userId);
                    return StatusCode(403, new { message = "TodoList not found or access denied" });
                }

                // Tạo item mới
                var todoItem = new TodoItem
                {
                    Title = createDto.Title,
                    Status = createDto.Status,
                    Priority = createDto.Priority,
                    DueDate = createDto.DueDate,
                    TodoListId = createDto.TodoListId
                };

                await _mongoContext.TodoItems.InsertOneAsync(todoItem);

                // Cập nhật ItemIds trong TodoList
                var updateList = Builders<TodoList>.Update.Push(list => list.ItemIds, todoItem.Id);
                await _mongoContext.TodoLists.UpdateOneAsync(listFilter, updateList);

                // Google Calendar integration đã được xóa

                var todoItemDto = new TodoItemDTO
                {
                    Id = todoItem.Id,
                    Title = todoItem.Title,
                    Status = todoItem.Status,
                    Priority = todoItem.Priority,
                    DueDate = todoItem.DueDate,
                    TodoListId = todoItem.TodoListId,
                    TodoListName = todoList.Name
                };

                _logger.LogInformation("Todo item created successfully: ItemId={ItemId}", todoItem.Id);
                return CreatedAtAction(nameof(GetTodoItem), new { id = todoItemDto.Id }, todoItemDto);
            }
            catch (MongoException mongoEx)
            {
                _logger.LogError(mongoEx, "MongoDB error creating todo item");
                return StatusCode(500, new { 
                    message = "Database error", 
                    error = mongoEx.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating todo item");
                return StatusCode(500, new { 
                    message = "Error creating todo item", 
                    error = ex.Message
                });
            }
        }

        // PUT: api/TodoItems/5 (NHẬN VÀO DTO)
        [HttpPut("{id}")]
        public async Task<IActionResult> PutTodoItem(string id, CreateTodoItemDTO updateDto)
        {
            var userId = GetCurrentUserId();

            var itemFilter = Builders<TodoItem>.Filter.Eq(item => item.Id, id);
            var todoItemFromDb = await _mongoContext.TodoItems.Find(itemFilter).FirstOrDefaultAsync();

            if (todoItemFromDb == null)
            {
                return NotFound();
            }

            // Kiểm tra quyền sở hữu qua TodoList
            var listFilter = Builders<TodoList>.Filter.And(
                Builders<TodoList>.Filter.Eq(list => list.Id, todoItemFromDb.TodoListId),
                Builders<TodoList>.Filter.Eq(list => list.AppUserId, userId)
            );
            var todoList = await _mongoContext.TodoLists.Find(listFilter).FirstOrDefaultAsync();

            if (todoList == null)
            {
                return Forbid();
            }

            // Lưu dueDate cũ để so sánh
            var oldDueDate = todoItemFromDb.DueDate;
            var categoryName = todoList.Name;

            // Cập nhật item
            var update = Builders<TodoItem>.Update
                .Set(item => item.Title, updateDto.Title)
                .Set(item => item.Status, updateDto.Status)
                .Set(item => item.Priority, updateDto.Priority)
                .Set(item => item.DueDate, updateDto.DueDate)
                .Set(item => item.TodoListId, updateDto.TodoListId);

            await _mongoContext.TodoItems.UpdateOneAsync(itemFilter, update);

            // Google Calendar integration đã được xóa

            return NoContent();
        }

        // DELETE: api/TodoItems/5 (XÓA)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTodoItem(string id)
        {
            var userId = GetCurrentUserId();

            var itemFilter = Builders<TodoItem>.Filter.Eq(item => item.Id, id);
            var todoItem = await _mongoContext.TodoItems.Find(itemFilter).FirstOrDefaultAsync();
            
            if (todoItem == null)
            {
                return NotFound();
            }

            // Kiểm tra quyền sở hữu qua TodoList
            var listFilter = Builders<TodoList>.Filter.And(
                Builders<TodoList>.Filter.Eq(list => list.Id, todoItem.TodoListId),
                Builders<TodoList>.Filter.Eq(list => list.AppUserId, userId)
            );
            var todoList = await _mongoContext.TodoLists.Find(listFilter).FirstOrDefaultAsync();

            if (todoList == null)
            {
                return Forbid();
            }

            // Google Calendar integration đã được xóa

            // Xóa item
            await _mongoContext.TodoItems.DeleteOneAsync(itemFilter);

            // Xóa itemId khỏi TodoList.ItemIds
            var updateList = Builders<TodoList>.Update.Pull(list => list.ItemIds, id);
            await _mongoContext.TodoLists.UpdateOneAsync(listFilter, updateList);

            return NoContent();
        }

        // GET: api/todoitems/my-all
        [HttpGet("my-all")]
        public async Task<ActionResult<IEnumerable<TodoItemDTO>>> GetAllMyItems()
        {
            var userId = GetCurrentUserId();

            // Lấy tất cả lists của user
            var listFilter = Builders<TodoList>.Filter.Eq(list => list.AppUserId, userId);
            var userLists = await _mongoContext.TodoLists.Find(listFilter).ToListAsync();
            var listIds = userLists.Select(l => l.Id).ToList();

            // Lấy tất cả items thuộc các lists này
            var itemFilter = Builders<TodoItem>.Filter.In(item => item.TodoListId, listIds);
            var items = await _mongoContext.TodoItems.Find(itemFilter)
                .SortByDescending(item => item.Priority)
                .ToListAsync();

            // Map sang DTO với TodoListName
            var itemDtos = items.Select(item =>
            {
                var list = userLists.FirstOrDefault(l => l.Id == item.TodoListId);
                return new TodoItemDTO
                {
                    Id = item.Id,
                    Title = item.Title,
                    Status = item.Status,
                    Priority = item.Priority,
                    DueDate = item.DueDate,
                    TodoListId = item.TodoListId,
                    TodoListName = list?.Name
                };
            }).ToList();

            return Ok(itemDtos);
        }

        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateItemStatus(string id, [FromBody] UpdateItemStatusDTO statusDto)
        {
            var filter = Builders<TodoItem>.Filter.Eq(item => item.Id, id);
            var todoItem = await _mongoContext.TodoItems.Find(filter).FirstOrDefaultAsync();
            
            if (todoItem == null)
            {
                return NotFound();
            }

            // Cập nhật chỉ 1 trường
            var update = Builders<TodoItem>.Update.Set(item => item.Status, statusDto.Status);
            await _mongoContext.TodoItems.UpdateOneAsync(filter, update);

            return NoContent();
        }


    }
}