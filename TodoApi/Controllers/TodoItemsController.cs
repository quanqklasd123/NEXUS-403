// Controllers/TodoItemsController.cs
using Microsoft.AspNetCore.Mvc;
using TodoApi.Data;
using TodoApi.Models;
using AutoMapper;
using TodoApi.Dtos;
using TodoApi.Helpers;
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
        private readonly AppDbContext _appContext;
        private readonly TenantSecurityHelper _securityHelper;
        private readonly IMapper _mapper;
        private readonly ILogger<TodoItemsController> _logger;

        public TodoItemsController(
            MongoDbContext mongoContext,
            AppDbContext appContext,
            TenantSecurityHelper securityHelper,
            IMapper mapper,
            ILogger<TodoItemsController> logger)
        {
            _mongoContext = mongoContext;
            _appContext = appContext;
            _securityHelper = securityHelper;
            _mapper = mapper;
            _logger = logger;
        }

        private string GetCurrentUserId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier);
        }


        // GET: api/TodoItems - Lấy danh sách TodoItems (Trả về dạng DTO)
        // Tham số truy vấn (Query parameters): ?appId={appId}&todoListId={todoListId} (cả hai đều không bắt buộc)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TodoItemDTO>>> GetTodoItems([FromQuery] string? appId = null, [FromQuery] string? todoListId = null)
        {
            try
            {
                var userId = GetCurrentUserId();

                if (string.IsNullOrEmpty(userId))
                {
                    _logger.LogWarning("User ID not found in token");
                    return Unauthorized(new { message = "User ID not found in token" });
                }

                // Validate và verify AppId ownership nếu có
                if (!string.IsNullOrWhiteSpace(appId))
                {
                    if (!_securityHelper.IsValidObjectId(appId))
                    {
                        _logger.LogWarning("Invalid AppId format: {AppId}", appId);
                        return BadRequest(new { message = "Invalid AppId format" });
                    }

                    if (!await _securityHelper.VerifyAppOwnershipAsync(appId, userId))
                    {
                        _logger.LogWarning("User {UserId} attempted to access app {AppId} without ownership", userId, appId);
                        return Forbid("You don't have access to this app");
                    }
                }

                _logger.LogInformation("GetTodoItems called for userId: {UserId}, appId: {AppId}, todoListId: {TodoListId}", 
                    userId, appId ?? "null", todoListId ?? "null");

                // Xây dựng bộ lọc (filter): lọc theo AppId và TodoListId
                var filterBuilder = Builders<TodoItem>.Filter;
                FilterDefinition<TodoItem>? filter = null;

                // Nếu có appId, lọc theo AppId
                if (!string.IsNullOrWhiteSpace(appId))
                {
                    filter = filterBuilder.Eq(item => item.AppId, appId);
                }

                // Nếu có todoListId, filter thêm theo TodoListId
                if (!string.IsNullOrWhiteSpace(todoListId))
                {
                    if (filter == null)
                    {
                        filter = filterBuilder.Eq(item => item.TodoListId, todoListId);
                    }
                    else
                    {
                        filter = filterBuilder.And(
                            filter,
                            filterBuilder.Eq(item => item.TodoListId, todoListId)
                        );
                    }
                }

                // Lấy collections từ đúng database (dùng cho cả filter và load names)
                var listCollection = _appContext.GetAppCollection<TodoList>(appId, "todoLists");

                // Nếu không có bộ lọc nào, lọc theo tất cả items của user (thông qua TodoLists)
                if (filter == null)
                {
                    // Lấy tất cả các TodoLists của user để lọc items
                    var listFilter = Builders<TodoList>.Filter.Eq(list => list.AppUserId, userId);
                    var userLists = await listCollection.Find(listFilter).ToListAsync();
                    var listIds = userLists.Select(l => l.Id).ToList();

                    if (listIds.Any())
                    {
                        filter = filterBuilder.In(item => item.TodoListId, listIds);
                    }
                    else
                    {
                        // Không có list nào, trả về danh sách rỗng
                        return Ok(new List<TodoItemDTO>());
                    }
                }
                else
                {
                    // Xác minh items thuộc về user thông qua TodoList (ownership verification)
                    // (sẽ kiểm tra sau khi tải items)
                }

                // Lấy collection từ đúng database (app database hoặc main database)
                var collection = _appContext.GetAppCollection<TodoItem>(appId, "todoItems");
                var todoItems = await collection.Find(filter).ToListAsync();

                _logger.LogInformation("Found {Count} items for user {UserId}, appId: {AppId}, todoListId: {TodoListId}", 
                    todoItems.Count, userId, appId ?? "null", todoListId ?? "null");

                // Load TodoList names từ cùng database (listCollection đã được khai báo ở trên)
                var itemDtos = new List<TodoItemDTO>();
                
                foreach (var item in todoItems)
                {
                    try
                    {
                        var listFilter = Builders<TodoList>.Filter.Eq(list => list.Id, item.TodoListId);
                        var list = await listCollection.Find(listFilter).FirstOrDefaultAsync();
                        
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
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error loading list for item {ItemId}", item.Id);
                        itemDtos.Add(new TodoItemDTO
                        {
                            Id = item.Id,
                            Title = item.Title,
                            Status = item.Status,
                            Priority = item.Priority,
                            DueDate = item.DueDate,
                            TodoListId = item.TodoListId,
                            TodoListName = null
                        });
                    }
                }
            
                return Ok(itemDtos);
            }
            catch (MongoException mongoEx)
            {
                _logger.LogError(mongoEx, "MongoDB error retrieving todo items");
                return StatusCode(500, new { 
                    message = "Database error", 
                    error = mongoEx.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving todo items");
                return StatusCode(500, new { 
                    message = "Error retrieving todo items", 
                    error = ex.Message
                });
            }
        }

        // GET: api/TodoItems/5 (Trả về DTO)
        [HttpGet("{id}")]
        public async Task<ActionResult<TodoItemDTO>> GetTodoItem(string id)
        {
            try
            {
                var userId = GetCurrentUserId();

                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { message = "User ID not found in token" });
                }

                // Tìm item từ main database trước để lấy AppId
                var mainFilter = Builders<TodoItem>.Filter.Eq(item => item.Id, id);
                var todoItem = await _mongoContext.TodoItems.Find(mainFilter).FirstOrDefaultAsync();

                if (todoItem == null)
                {
                    return NotFound(new { message = "TodoItem not found" });
                }

                var appId = todoItem.AppId;

                // Validate và verify AppId ownership nếu có
                if (!string.IsNullOrWhiteSpace(appId))
                {
                    if (!_securityHelper.IsValidObjectId(appId))
                    {
                        return BadRequest(new { message = "Invalid AppId format" });
                    }

                    if (!await _securityHelper.VerifyAppOwnershipAsync(appId, userId))
                    {
                        _logger.LogWarning("User {UserId} attempted to access item {ItemId} with unauthorized app {AppId}", userId, id, appId);
                        return Forbid("You don't have access to this app");
                    }
                }

                // Lấy item từ đúng database
                var collection = _appContext.GetAppCollection<TodoItem>(appId, "todoItems");
                var filter = Builders<TodoItem>.Filter.Eq(item => item.Id, id);

                // Nếu có AppId, filter thêm theo AppId
                if (!string.IsNullOrWhiteSpace(appId))
                {
                    filter = Builders<TodoItem>.Filter.And(
                        filter,
                        Builders<TodoItem>.Filter.Eq(item => item.AppId, appId)
                    );
                }

                todoItem = await collection.Find(filter).FirstOrDefaultAsync();

                if (todoItem == null)
                {
                    return NotFound(new { message = "TodoItem not found" });
                }

                // Verify ownership thông qua TodoList
                var listCollection = _appContext.GetAppCollection<TodoList>(appId, "todoLists");
                var listFilter = Builders<TodoList>.Filter.And(
                    Builders<TodoList>.Filter.Eq(list => list.Id, todoItem.TodoListId),
                    Builders<TodoList>.Filter.Eq(list => list.AppUserId, userId)
                );
                var list = await listCollection.Find(listFilter).FirstOrDefaultAsync();

                if (list == null)
                {
                    _logger.LogWarning("User {UserId} attempted to access item {ItemId} without ownership", userId, id);
                    return Forbid("You don't have access to this item");
                }

                // list đã được load ở trên

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
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving todo item {ItemId}", id);
                return StatusCode(500, new { 
                    message = "Error retrieving todo item", 
                    error = ex.Message
                });
            }
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
                        _logger.LogWarning("User {UserId} attempted to create item with unauthorized app {AppId}", userId, appId);
                        return Forbid("You don't have access to this app");
                    }
                }

                _logger.LogInformation("Creating todo item: Title={Title}, TodoListId={TodoListId}, UserId={UserId}, AppId={AppId}", 
                    createDto.Title, createDto.TodoListId, userId, appId ?? "null");

                // Lấy collections từ đúng database
                var listCollection = _appContext.GetAppCollection<TodoList>(appId, "todoLists");

                // Kiểm tra xem List có thuộc về user này không
                var listFilterBuilder = Builders<TodoList>.Filter;
                var listFilter = listFilterBuilder.And(
                    listFilterBuilder.Eq(list => list.Id, createDto.TodoListId),
                    listFilterBuilder.Eq(list => list.AppUserId, userId)
                );
                
                var todoList = await listCollection.Find(listFilter).FirstOrDefaultAsync();
                
                if (todoList == null)
                {
                    _logger.LogWarning("TodoList not found or access denied: TodoListId={TodoListId}, UserId={UserId}, AppId={AppId}", 
                        createDto.TodoListId, userId, appId ?? "null");
                    return StatusCode(403, new { message = "TodoList not found or access denied." });
                }

                // Verify TodoListId thuộc về cùng AppId (nếu cả 2 đều có AppId)
                // Cho phép tạo item vào TodoList có appId=null (backward compatible)
                if (!string.IsNullOrWhiteSpace(appId) && !string.IsNullOrWhiteSpace(todoList.AppId) && todoList.AppId != appId)
                {
                    _logger.LogWarning("TodoList {TodoListId} belongs to different AppId. TodoList.AppId={TodoListAppId}, Request.AppId={RequestAppId}", 
                        createDto.TodoListId, todoList.AppId, appId);
                    return BadRequest(new { message = "TodoList does not belong to the specified AppId" });
                }

                // Tạo item mới
                var todoItem = new TodoItem
                {
                    Title = createDto.Title,
                    Status = createDto.Status,
                    Priority = createDto.Priority,
                    DueDate = createDto.DueDate,
                    TodoListId = createDto.TodoListId,
                    AppId = appId ?? todoList.AppId // Dùng AppId từ DTO hoặc từ TodoList
                };

                // Insert vào đúng database
                var itemsCollection = _appContext.GetAppCollection<TodoItem>(appId ?? todoList.AppId, "todoItems");
                await itemsCollection.InsertOneAsync(todoItem);

                // Cập nhật ItemIds trong TodoList
                var updateList = Builders<TodoList>.Update.Push(list => list.ItemIds, todoItem.Id);
                await listCollection.UpdateOneAsync(listFilter, updateList);

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

                _logger.LogInformation("Todo item created successfully: ItemId={ItemId}, AppId={AppId}", todoItem.Id, appId ?? "null");
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
        public async Task<IActionResult> PutTodoItem(string id, CreateTodoItemDTO updateDto, [FromQuery] string? appId = null)
        {
            try
            {
                var userId = GetCurrentUserId();

                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { message = "User ID not found in token" });
                }

                // Ưu tiên appId từ query params, sau đó từ DTO
                var currentAppId = appId ?? updateDto.AppId;
                var newAppId = updateDto.AppId;

                // Lấy item từ đúng database để verify tồn tại
                var itemCollection = _appContext.GetAppCollection<TodoItem>(currentAppId, "todoItems");
                var itemFilter = Builders<TodoItem>.Filter.Eq(item => item.Id, id);
                var todoItemFromDb = await itemCollection.Find(itemFilter).FirstOrDefaultAsync();

                if (todoItemFromDb == null)
                {
                    return NotFound(new { message = "TodoItem not found" });
                }

                // Validate và verify AppId ownership cho AppId mới nếu có
                if (!string.IsNullOrWhiteSpace(newAppId))
                {
                    if (!_securityHelper.IsValidObjectId(newAppId))
                    {
                        return BadRequest(new { message = "Invalid AppId format" });
                    }

                    if (!await _securityHelper.VerifyAppOwnershipAsync(newAppId, userId))
                    {
                        _logger.LogWarning("User {UserId} attempted to update item {ItemId} with unauthorized app {AppId}", userId, id, newAppId);
                        return Forbid("You don't have access to this app");
                    }
                }

                // Lấy collections từ đúng database
                var listCollection = _appContext.GetAppCollection<TodoList>(currentAppId ?? newAppId, "todoLists");

                // Kiểm tra quyền sở hữu qua TodoList
                var listFilter = Builders<TodoList>.Filter.And(
                    Builders<TodoList>.Filter.Eq(list => list.Id, todoItemFromDb.TodoListId),
                    Builders<TodoList>.Filter.Eq(list => list.AppUserId, userId)
                );
                var todoList = await listCollection.Find(listFilter).FirstOrDefaultAsync();

                if (todoList == null)
                {
                    return Forbid("You don't have access to this item");
                }

                // Nếu update TodoListId, verify TodoListId mới thuộc về cùng AppId
                if (!string.IsNullOrWhiteSpace(updateDto.TodoListId) && updateDto.TodoListId != todoItemFromDb.TodoListId)
                {
                    var newListFilter = Builders<TodoList>.Filter.And(
                        Builders<TodoList>.Filter.Eq(list => list.Id, updateDto.TodoListId),
                        Builders<TodoList>.Filter.Eq(list => list.AppUserId, userId)
                    );

                    if (!string.IsNullOrWhiteSpace(newAppId ?? currentAppId))
                    {
                        newListFilter = Builders<TodoList>.Filter.And(
                            newListFilter,
                            Builders<TodoList>.Filter.Eq(list => list.AppId, newAppId ?? currentAppId)
                        );
                    }

                    var newList = await listCollection.Find(newListFilter).FirstOrDefaultAsync();
                    if (newList == null)
                    {
                        return BadRequest(new { message = "New TodoList not found or does not belong to the same AppId" });
                    }
                }

                // Build update (itemFilter đã có từ trước)
                itemFilter = Builders<TodoItem>.Filter.Eq(item => item.Id, id);
                if (!string.IsNullOrWhiteSpace(currentAppId))
                {
                    itemFilter = Builders<TodoItem>.Filter.And(
                        itemFilter,
                        Builders<TodoItem>.Filter.Eq(item => item.AppId, currentAppId)
                    );
                }

                var update = Builders<TodoItem>.Update
                    .Set(item => item.Title, updateDto.Title)
                    .Set(item => item.Status, updateDto.Status)
                    .Set(item => item.Priority, updateDto.Priority)
                    .Set(item => item.DueDate, updateDto.DueDate)
                    .Set(item => item.TodoListId, updateDto.TodoListId);

                // Update AppId nếu có trong DTO và khác với hiện tại
                if (newAppId != currentAppId && !string.IsNullOrWhiteSpace(newAppId))
                {
                    update = update.Set(item => item.AppId, newAppId);
                }

                await itemCollection.UpdateOneAsync(itemFilter, update);

                _logger.LogInformation("Updated TodoItem {ItemId} for user {UserId}", id, userId);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating todo item {ItemId}", id);
                return StatusCode(500, new { 
                    message = "Error updating todo item", 
                    error = ex.Message
                });
            }
        }

        // DELETE: api/TodoItems/5 (XÓA)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTodoItem(string id, [FromQuery] string? appId = null)
        {
            try
            {
                var userId = GetCurrentUserId();

                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { message = "User ID not found in token" });
                }

                // Lấy collections từ đúng database
                var itemsCollection = _appContext.GetAppCollection<TodoItem>(appId, "todoItems");
                var listCollection = _appContext.GetAppCollection<TodoList>(appId, "todoLists");

                // Tìm item để verify tồn tại và lấy thông tin
                var itemFilter = Builders<TodoItem>.Filter.Eq(item => item.Id, id);
                var todoItem = await itemsCollection.Find(itemFilter).FirstOrDefaultAsync();
            
                if (todoItem == null)
                {
                    return NotFound(new { message = "TodoItem not found" });
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
                        _logger.LogWarning("User {UserId} attempted to delete item {ItemId} with unauthorized app {AppId}", userId, id, appId);
                        return Forbid("You don't have access to this app");
                    }
                }

                // Kiểm tra quyền sở hữu qua TodoList
                var listFilter = Builders<TodoList>.Filter.And(
                    Builders<TodoList>.Filter.Eq(list => list.Id, todoItem.TodoListId),
                    Builders<TodoList>.Filter.Eq(list => list.AppUserId, userId)
                );
                var todoList = await listCollection.Find(listFilter).FirstOrDefaultAsync();

                if (todoList == null)
                {
                    return Forbid("You don't have access to this item");
                }

                // Update filter with appId if present (itemFilter đã có từ trước)
                if (!string.IsNullOrWhiteSpace(appId))
                {
                    itemFilter = Builders<TodoItem>.Filter.And(
                        itemFilter,
                        Builders<TodoItem>.Filter.Eq(item => item.AppId, appId)
                    );
                }

                // Xóa item
                var deleteResult = await itemsCollection.DeleteOneAsync(itemFilter);

                if (deleteResult.DeletedCount == 0)
                {
                    return NotFound(new { message = "TodoItem not found" });
                }

                // Xóa itemId khỏi TodoList.ItemIds
                var updateList = Builders<TodoList>.Update.Pull(list => list.ItemIds, id);
                await listCollection.UpdateOneAsync(listFilter, updateList);

                _logger.LogInformation("Deleted TodoItem {ItemId} for user {UserId}", id, userId);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting todo item {ItemId}", id);
                return StatusCode(500, new { 
                    message = "Error deleting todo item", 
                    error = ex.Message
                });
            }
        }

        // GET: api/todoitems/my-all
        [HttpGet("my-all")]
        public async Task<ActionResult<IEnumerable<TodoItemDTO>>> GetAllMyItems([FromQuery] string? appId = null)
        {
            var userId = GetCurrentUserId();

            // Lấy collections từ đúng database (app database hoặc main database)
            var listCollection = _appContext.GetAppCollection<TodoList>(appId, "todoLists");
            var itemCollection = _appContext.GetAppCollection<TodoItem>(appId, "todoItems");

            // Lấy tất cả lists của user
            var listFilterBuilder = Builders<TodoList>.Filter;
            var listFilter = listFilterBuilder.Eq(list => list.AppUserId, userId);
            
            // Nếu có appId, thêm filter theo appId
            if (!string.IsNullOrWhiteSpace(appId))
            {
                listFilter = listFilterBuilder.And(
                    listFilter,
                    listFilterBuilder.Or(
                        listFilterBuilder.Eq(list => list.AppId, appId),
                        listFilterBuilder.Eq(list => list.AppId, null) // Cho phép lists cũ không có appId
                    )
                );
            }
            
            var userLists = await listCollection.Find(listFilter).ToListAsync();
            var listIds = userLists.Select(l => l.Id).ToList();

            // Lấy tất cả items thuộc các lists này
            var itemFilter = Builders<TodoItem>.Filter.In(item => item.TodoListId, listIds);
            var items = await itemCollection.Find(itemFilter)
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
        public async Task<IActionResult> UpdateItemStatus(string id, [FromBody] UpdateItemStatusDTO statusDto, [FromQuery] string? appId = null)
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
                        _logger.LogWarning("User {UserId} attempted to update status for item {ItemId} with unauthorized app {AppId}", userId, id, appId);
                        return Forbid("You don't have access to this app");
                    }
                }

                // Lấy collection từ đúng database
                var itemsCollection = _appContext.GetAppCollection<TodoItem>(appId, "todoItems");
                var listCollection = _appContext.GetAppCollection<TodoList>(appId, "todoLists");

                // Tìm item
                var filter = Builders<TodoItem>.Filter.Eq(item => item.Id, id);
                if (!string.IsNullOrWhiteSpace(appId))
                {
                    filter = Builders<TodoItem>.Filter.And(
                        filter,
                        Builders<TodoItem>.Filter.Eq(item => item.AppId, appId)
                    );
                }

                var todoItem = await itemsCollection.Find(filter).FirstOrDefaultAsync();
                
                if (todoItem == null)
                {
                    return NotFound(new { message = "TodoItem not found" });
                }

                // Verify ownership qua TodoList
                var listFilter = Builders<TodoList>.Filter.And(
                    Builders<TodoList>.Filter.Eq(list => list.Id, todoItem.TodoListId),
                    Builders<TodoList>.Filter.Eq(list => list.AppUserId, userId)
                );
                var todoList = await listCollection.Find(listFilter).FirstOrDefaultAsync();

                if (todoList == null)
                {
                    return Forbid("You don't have access to this item");
                }

                // Cập nhật status
                var update = Builders<TodoItem>.Update.Set(item => item.Status, statusDto.Status);
                await itemsCollection.UpdateOneAsync(filter, update);

                _logger.LogInformation("Updated status for TodoItem {ItemId} to {Status} for user {UserId}", id, statusDto.Status, userId);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating todo item status {ItemId}", id);
                return StatusCode(500, new { 
                    message = "Error updating todo item status", 
                    error = ex.Message
                });
            }
        }


    }
}