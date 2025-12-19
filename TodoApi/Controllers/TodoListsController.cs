// Controllers/TodoListsController.cs
using Microsoft.AspNetCore.Mvc;
using TodoApi.Data;
using TodoApi.Models;
using AutoMapper;
using TodoApi.Dtos;
using TodoApi.Helpers;
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
        private readonly AppDbContext _appContext;
        private readonly TenantSecurityHelper _securityHelper;
        private readonly IMapper _mapper;
        private readonly ILogger<TodoListsController> _logger;

        public TodoListsController(
            MongoDbContext mongoContext, 
            AppDbContext appContext,
            TenantSecurityHelper securityHelper,
            IMapper mapper, 
            ILogger<TodoListsController> logger)
        {
            _mongoContext = mongoContext;
            _appContext = appContext;
            _securityHelper = securityHelper;
            _mapper = mapper;
            _logger = logger;
        }

        private string GetCurrentUserId()
        {
            // Lấy thông tin 'sub' (Subject - ID người dùng) từ JWT Token
            return User.FindFirstValue(ClaimTypes.NameIdentifier);
        }


        // GET: api/TodoLists - Lấy danh sách tất cả TodoLists của tôi (CHỈ LẤY CỦA NGƯỜI DÙNG HIỆN TẠI)
        // Tham số truy vấn (query parameter): ?appId={appId} (không bắt buộc)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TodoListDTO>>> GetTodoLists([FromQuery] string? appId = null)
        {
            try
            {
                var userId = GetCurrentUserId();
                
                if (string.IsNullOrEmpty(userId))
                {
                    _logger.LogWarning("User ID not found in token");
                    return Unauthorized(new { message = "User ID not found in token" });
                }

                // Kiểm tra tính hợp lệ (validate) và xác minh quyền sở hữu AppId nếu có
                if (!string.IsNullOrWhiteSpace(appId))
                {
                    // Kiểm tra định dạng AppId (phải là MongoDB ObjectId hợp lệ)
                    if (!_securityHelper.IsValidObjectId(appId))
                    {
                        _logger.LogWarning("Invalid AppId format: {AppId}", appId);
                        return BadRequest(new { message = "Invalid AppId format" });
                    }

                    // Xác minh quyền sở hữu (verify ownership) - đảm bảo app thuộc về user hiện tại
                    if (!await _securityHelper.VerifyAppOwnershipAsync(appId, userId))
                    {
                        _logger.LogWarning("User {UserId} attempted to access app {AppId} without ownership", userId, appId);
                        return Forbid("You don't have access to this app");
                    }
                }

                _logger.LogInformation("GetTodoLists called for userId: {UserId}, appId: {AppId}", userId, appId ?? "null");

                // Xây dựng bộ lọc (filter): luôn lọc theo AppUserId (bắt buộc để bảo mật)
                var filterBuilder = Builders<TodoList>.Filter;
                var filter = filterBuilder.Eq(list => list.AppUserId, userId);

                // Nếu có appId, thêm điều kiện lọc theo AppId nữa
                if (!string.IsNullOrWhiteSpace(appId))
                {
                    filter = filterBuilder.And(
                        filter,
                        filterBuilder.Eq(list => list.AppId, appId)
                    );
                }

                // Lấy collection từ đúng database (có thể là app database hoặc main database)
                var collection = _appContext.GetAppCollection<TodoList>(appId, "todoLists");
                var lists = await collection.Find(filter).ToListAsync();

                _logger.LogInformation("Found {Count} lists for user {UserId}, appId: {AppId}", lists.Count, userId, appId ?? "null");

                // Tải (load) các items cho mỗi list từ đúng database
                var listDtos = new List<TodoListDTO>();
                foreach (var list in lists)
                {
                    try
                    {
                        // Lấy các items từ cùng database với list (bảo đảm tính nhất quán dữ liệu)
                        var itemsCollection = _appContext.GetAppCollection<TodoItem>(appId ?? list.AppId, "todoItems");
                        var itemFilter = Builders<TodoItem>.Filter.Eq(item => item.TodoListId, list.Id);
                        var items = await itemsCollection.Find(itemFilter).ToListAsync();
                        
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
                        // Vẫn thêm list vào kết quả nhưng không có items (tránh mất dữ liệu)
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
            try
            {
                var userId = GetCurrentUserId();

                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { message = "User ID not found in token" });
                }

                // Tìm list từ main database trước để lấy AppId
                var mainFilter = Builders<TodoList>.Filter.And(
                    Builders<TodoList>.Filter.Eq(list => list.Id, id),
                    Builders<TodoList>.Filter.Eq(list => list.AppUserId, userId)
                );

                var todoList = await _mongoContext.TodoLists.Find(mainFilter).FirstOrDefaultAsync();

                if (todoList == null)
                {
                    // Nếu không tìm thấy trong main database, thử tìm trong app databases
                    // (cho backward compatibility với data cũ không có AppId)
                    return NotFound(new { message = "TodoList not found" });
                }

                // Lấy AppId từ list (có thể null cho backward compatibility)
                var appId = todoList.AppId;

                // Validate và verify AppId ownership nếu có
                if (!string.IsNullOrWhiteSpace(appId))
                {
                    if (!_securityHelper.IsValidObjectId(appId))
                    {
                        return BadRequest(new { message = "Invalid AppId format" });
                    }

                    if (!await _securityHelper.VerifyAppOwnershipAsync(appId, userId))
                    {
                        _logger.LogWarning("User {UserId} attempted to access list {ListId} with unauthorized app {AppId}", userId, id, appId);
                        return Forbid("You don't have access to this app");
                    }
                }

                // Lấy list từ đúng database (có thể là app database hoặc main database)
                var collection = _appContext.GetAppCollection<TodoList>(appId, "todoLists");
                var filter = Builders<TodoList>.Filter.And(
                    Builders<TodoList>.Filter.Eq(list => list.Id, id),
                    Builders<TodoList>.Filter.Eq(list => list.AppUserId, userId)
                );

                // Nếu có AppId, filter thêm theo AppId
                if (!string.IsNullOrWhiteSpace(appId))
                {
                    filter = Builders<TodoList>.Filter.And(
                        filter,
                        Builders<TodoList>.Filter.Eq(list => list.AppId, appId)
                    );
                }

                todoList = await collection.Find(filter).FirstOrDefaultAsync();

                if (todoList == null)
                {
                    return NotFound(new { message = "TodoList not found" });
                }

                // Load items từ cùng database
                var itemsCollection = _appContext.GetAppCollection<TodoItem>(appId, "todoItems");
                var itemFilter = Builders<TodoItem>.Filter.Eq(item => item.TodoListId, todoList.Id);
                var items = await itemsCollection.Find(itemFilter).ToListAsync();

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
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving todo list {ListId}", id);
                return StatusCode(500, new { 
                    message = "Error retrieving todo list", 
                    error = ex.Message
                });
            }
        }

        // POST: api/TodoLists - Tạo mới TodoList (TỰ ĐỘNG GÁN USER HIỆN TẠI LÀM CHỦ SỞHỮU)
        [HttpPost]
        public async Task<ActionResult<TodoListDTO>> PostTodoList(CreateTodoListDTO createDto)
        {
            try
            {
                var userId = GetCurrentUserId();

                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { message = "User ID not found in token" });
                }

                var appId = createDto.AppId;

                // Validate và verify AppId ownership nếu có
                if (!string.IsNullOrWhiteSpace(appId))
                {
                    if (!_securityHelper.IsValidObjectId(appId))
                    {
                        return BadRequest(new { message = "Invalid AppId format" });
                    }

                    if (!await _securityHelper.VerifyAppOwnershipAsync(appId, userId))
                    {
                        _logger.LogWarning("User {UserId} attempted to create list with unauthorized app {AppId}", userId, appId);
                        return Forbid("You don't have access to this app");
                    }
                }

                var todoList = new TodoList
                {
                    Name = createDto.Name,
                    AppUserId = userId,
                    AppId = appId, // Set AppId từ DTO
                    ItemIds = new List<string>()
                };

                // Chèn (Insert) vào đúng database (app database hoặc main database tùy theo AppId)
                var collection = _appContext.GetAppCollection<TodoList>(appId, "todoLists");
                await collection.InsertOneAsync(todoList);

                _logger.LogInformation("Created TodoList {ListId} for user {UserId}, appId: {AppId}", todoList.Id, userId, appId ?? "null");

                var listDto = new TodoListDTO
                {
                    Id = todoList.Id,
                    Name = todoList.Name,
                    Items = new List<TodoItemDTO>()
                };

                return CreatedAtAction(nameof(GetTodoList), new { id = listDto.Id }, listDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating todo list");
                return StatusCode(500, new { 
                    message = "Error creating todo list", 
                    error = ex.Message
                });
            }
        }

        // PUT: api/TodoLists/5 - Cập nhật TodoList (PHẢI LÀ CỦA NGƯỜI DÙNG HIỆN TẠI)
        [HttpPut("{id}")]
        public async Task<IActionResult> PutTodoList(string id, [FromBody] CreateTodoListDTO updateDto)
        {
            try
            {
                if (updateDto == null || string.IsNullOrWhiteSpace(updateDto.Name))
                {
                    return BadRequest(new { message = "Name is required" });
                }

                var userId = GetCurrentUserId();

                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { message = "User ID not found in token" });
                }

                var appId = updateDto.AppId;

                // Validate và verify AppId ownership nếu có
                if (!string.IsNullOrWhiteSpace(appId))
                {
                    if (!_securityHelper.IsValidObjectId(appId))
                    {
                        return BadRequest(new { message = "Invalid AppId format" });
                    }

                    if (!await _securityHelper.VerifyAppOwnershipAsync(appId, userId))
                    {
                        _logger.LogWarning("User {UserId} attempted to update list {ListId} with unauthorized app {AppId}", userId, id, appId);
                        return Forbid("You don't have access to this app");
                    }
                }

                // Lấy collection từ đúng database (dựa vào AppId gửi lên)
                var collection = _appContext.GetAppCollection<TodoList>(appId, "todoLists");
                
                var filter = Builders<TodoList>.Filter.And(
                    Builders<TodoList>.Filter.Eq(list => list.Id, id),
                    Builders<TodoList>.Filter.Eq(list => list.AppUserId, userId)
                );

                // Nếu có AppId, filter thêm theo AppId để đảm bảo chính xác
                if (!string.IsNullOrWhiteSpace(appId))
                {
                    filter = Builders<TodoList>.Filter.And(
                        filter,
                        Builders<TodoList>.Filter.Eq(list => list.AppId, appId)
                    );
                }

                var existingList = await collection.Find(filter).FirstOrDefaultAsync();

                if (existingList == null)
                {
                    return NotFound(new { message = "TodoList not found" });
                }

                // Build update
                var update = Builders<TodoList>.Update.Set(list => list.Name, updateDto.Name);

                await collection.UpdateOneAsync(filter, update);

                var listDto = new TodoListDTO
                {
                    Id = id,
                    Name = updateDto.Name,
                    Items = new List<TodoItemDTO>()
                };
                return Ok(listDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating todo list {ListId}", id);
                return StatusCode(500, new { 
                    message = "Error updating todo list", 
                    error = ex.Message
                });
            }
        }

        // DELETE: api/TodoLists/5 - Xóa TodoList (PHẢI LÀ CỦA NGƯỜI DÙNG HIỆN TẠI)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTodoList(string id, [FromQuery] string? appId = null)
        {
            try
            {
                var userId = GetCurrentUserId();

                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { message = "User ID not found in token" });
                }

                // Validate và verify AppId ownership nếu có
                if (!string.IsNullOrWhiteSpace(appId))
                {
                    if (!_securityHelper.IsValidObjectId(appId))
                    {
                        return BadRequest(new { message = "Invalid AppId format" });
                    }

                    if (!await _securityHelper.VerifyAppOwnershipAsync(appId, userId))
                    {
                        _logger.LogWarning("User {UserId} attempted to delete list {ListId} with unauthorized app {AppId}", userId, id, appId);
                        return Forbid("You don't have access to this app");
                    }
                }

                // Lấy collections từ đúng database
                var itemsCollection = _appContext.GetAppCollection<TodoItem>(appId, "todoItems");
                var listCollection = _appContext.GetAppCollection<TodoList>(appId, "todoLists");

                // Xóa tất cả các items trong list trước (xóa theo tầng - cascade delete)
                var itemFilter = Builders<TodoItem>.Filter.Eq(item => item.TodoListId, id);
                var deleteItemsResult = await itemsCollection.DeleteManyAsync(itemFilter);
                _logger.LogInformation("Deleted {Count} items for list {ListId}", deleteItemsResult.DeletedCount, id);

                // Xóa list
                var filter = Builders<TodoList>.Filter.And(
                    Builders<TodoList>.Filter.Eq(list => list.Id, id),
                    Builders<TodoList>.Filter.Eq(list => list.AppUserId, userId)
                );

                // Nếu có AppId, filter thêm theo AppId
                if (!string.IsNullOrWhiteSpace(appId))
                {
                    filter = Builders<TodoList>.Filter.And(
                        filter,
                        Builders<TodoList>.Filter.Eq(list => list.AppId, appId)
                    );
                }

                var result = await listCollection.DeleteOneAsync(filter);

                if (result.DeletedCount == 0)
                {
                    return NotFound(new { message = "TodoList not found" });
                }

                _logger.LogInformation("Deleted TodoList {ListId} for user {UserId}", id, userId);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting todo list {ListId}", id);
                return StatusCode(500, new { 
                    message = "Error deleting todo list", 
                    error = ex.Message
                });
            }
        }
    }
}