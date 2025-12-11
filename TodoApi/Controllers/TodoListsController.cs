// Controllers/TodoListsController.cs
using Microsoft.AspNetCore.Mvc;
using TodoApi.Data;
using TodoApi.Models;
using AutoMapper;
using TodoApi.Dtos;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using MongoDB.Driver;
using Microsoft.Extensions.Logging;

namespace TodoApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class TodoListsController : ControllerBase
    {
        private readonly MongoDbContext _mongoContext;
        private readonly IMapper _mapper;
        private readonly ILogger<TodoListsController> _logger;

        public TodoListsController(MongoDbContext mongoContext, IMapper mapper, ILogger<TodoListsController> logger)
        {
            _mongoContext = mongoContext;
            _mapper = mapper;
            _logger = logger;
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
            try
            {
                var userId = GetCurrentUserId();
                
                if (string.IsNullOrEmpty(userId))
                {
                    _logger.LogWarning("User ID not found in token");
                    return Unauthorized(new { message = "User ID not found in token" });
                }

                _logger.LogInformation("GetTodoLists called for userId: {UserId}", userId);

                var filter = Builders<TodoList>.Filter.Eq(list => list.AppUserId, userId);
                var lists = await _mongoContext.TodoLists.Find(filter).ToListAsync();

                _logger.LogInformation("Found {Count} lists for user {UserId}", lists.Count, userId);

                // Load items cho mỗi list
                var listDtos = new List<TodoListDTO>();
                foreach (var list in lists)
                {
                    try
                    {
                        var itemFilter = Builders<TodoItem>.Filter.Eq(item => item.TodoListId, list.Id);
                        var items = await _mongoContext.TodoItems.Find(itemFilter).ToListAsync();
                        
                        var listDto = new TodoListDTO
                        {
                            Id = list.Id,
                            Name = list.Name,
                            Items = items.Select(item => new TodoItemDTO
                            {
                                Id = item.Id,
                                Title = item.Title,
                                Status = item.Status,
                                Priority = item.Priority,
                                DueDate = item.DueDate,
                                TodoListId = item.TodoListId,
                                TodoListName = list.Name
                            }).ToList()
                        };
                        listDtos.Add(listDto);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error loading items for list {ListId}", list.Id);
                        // Vẫn thêm list nhưng không có items
                        listDtos.Add(new TodoListDTO
                        {
                            Id = list.Id,
                            Name = list.Name,
                            Items = new List<TodoItemDTO>()
                        });
                    }
                }

                return Ok(listDtos);
            }
            catch (MongoException mongoEx)
            {
                _logger.LogError(mongoEx, "MongoDB error retrieving todo lists");
                return StatusCode(500, new { 
                    message = "Database error", 
                    error = mongoEx.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving todo lists");
                return StatusCode(500, new { 
                    message = "Error retrieving todo lists", 
                    error = ex.Message
                });
            }
        }
        // GET: api/TodoLists/5 (CHỈ LẤY CỦA TÔI)
        [HttpGet("{id}")]
        public async Task<ActionResult<TodoListDTO>> GetTodoList(string id)
        {
            var userId = GetCurrentUserId();

            var filter = Builders<TodoList>.Filter.And(
                Builders<TodoList>.Filter.Eq(list => list.Id, id),
                Builders<TodoList>.Filter.Eq(list => list.AppUserId, userId)
            );

            var todoList = await _mongoContext.TodoLists.Find(filter).FirstOrDefaultAsync();

            if (todoList == null)
            {
                return NotFound();
            }

            // Load items
            var itemFilter = Builders<TodoItem>.Filter.Eq(item => item.TodoListId, todoList.Id);
            var items = await _mongoContext.TodoItems.Find(itemFilter).ToListAsync();

            var listDto = new TodoListDTO
            {
                Id = todoList.Id,
                Name = todoList.Name,
                Items = items.Select(item => new TodoItemDTO
                {
                    Id = item.Id,
                    Title = item.Title,
                    Status = item.Status,
                    Priority = item.Priority,
                    DueDate = item.DueDate,
                    TodoListId = item.TodoListId,
                    TodoListName = todoList.Name
                }).ToList()
            };

            return Ok(listDto);
        }

        // POST: api/TodoLists (TỰ ĐỘNG GÁN USER)
        [HttpPost]
        public async Task<ActionResult<TodoListDTO>> PostTodoList(CreateTodoListDTO createDto)
        {
            var userId = GetCurrentUserId();

            var todoList = new TodoList
            {
                Name = createDto.Name,
                AppUserId = userId,
                ItemIds = new List<string>()
            };

            await _mongoContext.TodoLists.InsertOneAsync(todoList);

            var listDto = new TodoListDTO
            {
                Id = todoList.Id,
                Name = todoList.Name,
                Items = new List<TodoItemDTO>()
            };

            return CreatedAtAction(nameof(GetTodoList), new { id = listDto.Id }, listDto);
        }

        // PUT: api/TodoLists/5 (PHẢI LÀ CỦA TÔI)
        [HttpPut("{id}")]
        public async Task<IActionResult> PutTodoList(string id, [FromBody] CreateTodoListDTO updateDto)
        {
            if (updateDto == null || string.IsNullOrWhiteSpace(updateDto.Name))
            {
                return BadRequest("Name is required");
            }

            var userId = GetCurrentUserId();

            var filter = Builders<TodoList>.Filter.And(
                Builders<TodoList>.Filter.Eq(list => list.Id, id),
                Builders<TodoList>.Filter.Eq(list => list.AppUserId, userId)
            );

            var todoList = await _mongoContext.TodoLists.Find(filter).FirstOrDefaultAsync();

            if (todoList == null)
            {
                return NotFound();
            }

            var update = Builders<TodoList>.Update.Set(list => list.Name, updateDto.Name);
            await _mongoContext.TodoLists.UpdateOneAsync(filter, update);

            var listDto = new TodoListDTO
            {
                Id = id,
                Name = updateDto.Name,
                Items = new List<TodoItemDTO>()
            };
            return Ok(listDto);
        }

        // DELETE: api/TodoLists/5 (PHẢI LÀ CỦA TÔI)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTodoList(string id)
        {
            var userId = GetCurrentUserId();

            var filter = Builders<TodoList>.Filter.And(
                Builders<TodoList>.Filter.Eq(list => list.Id, id),
                Builders<TodoList>.Filter.Eq(list => list.AppUserId, userId)
            );

            // Xóa tất cả items trong list trước
            var itemFilter = Builders<TodoItem>.Filter.Eq(item => item.TodoListId, id);
            await _mongoContext.TodoItems.DeleteManyAsync(itemFilter);

            // Xóa list
            var result = await _mongoContext.TodoLists.DeleteOneAsync(filter);

            if (result.DeletedCount == 0)
            {
                return NotFound();
            }

            return NoContent();
        }
    }
}