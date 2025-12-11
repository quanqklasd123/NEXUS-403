// src/utils/jwtUtils.js
// Utility functions để decode JWT token và kiểm tra role

/**
 * Decode JWT token (base64 decode phần payload)
 * @param {string} token - JWT token
 * @returns {object|null} - Decoded payload hoặc null nếu lỗi
 */
export const decodeJWT = (token) => {
    if (!token) return null;

    try {
        // JWT có format: header.payload.signature
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        // Decode phần payload (phần thứ 2)
        const payload = parts[1];
        // Base64 decode và parse JSON
        const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
        return decoded;
    } catch (error) {
        console.error('Error decoding JWT:', error);
        return null;
    }
};

/**
 * Lấy role từ JWT token
 * @param {string} token - JWT token (nếu không có sẽ lấy từ localStorage)
 * @returns {string[]} - Mảng các roles của user
 */
export const getUserRoles = (token = null) => {
    const tokenToUse = token || localStorage.getItem('authToken');
    if (!tokenToUse) return [];

    const decoded = decodeJWT(tokenToUse);
    if (!decoded) return [];

    // JWT claims có thể chứa role trong:
    // - decoded.role (nếu chỉ có 1 role)
    // - decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] (nếu nhiều roles)
    // - decoded.roles (nếu là array)
    
    // Thử các cách khác nhau
    if (decoded.role) {
        return Array.isArray(decoded.role) ? decoded.role : [decoded.role];
    }
    
    // ASP.NET Core thường dùng claim type này
    const roleClaim = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    if (roleClaim) {
        return Array.isArray(roleClaim) ? roleClaim : [roleClaim];
    }

    // Hoặc có thể là roles (plural)
    if (decoded.roles) {
        return Array.isArray(decoded.roles) ? decoded.roles : [decoded.roles];
    }

    return [];
};

/**
 * Kiểm tra xem user có phải Admin không
 * @param {string} token - JWT token (nếu không có sẽ lấy từ localStorage)
 * @returns {boolean} - true nếu user là Admin
 */
export const isAdmin = (token = null) => {
    const roles = getUserRoles(token);
    return roles.includes('Admin');
};

/**
 * Lấy thông tin user từ token
 * @param {string} token - JWT token (nếu không có sẽ lấy từ localStorage)
 * @returns {object|null} - Thông tin user (userId, email, roles) hoặc null
 */
export const getUserInfo = (token = null) => {
    const tokenToUse = token || localStorage.getItem('authToken');
    if (!tokenToUse) return null;

    const decoded = decodeJWT(tokenToUse);
    if (!decoded) return null;

    return {
        userId: decoded.sub || decoded.userId,
        email: decoded.email || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'],
        roles: getUserRoles(tokenToUse)
    };
};

