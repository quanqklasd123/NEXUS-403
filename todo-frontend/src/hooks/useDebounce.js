// src/hooks/useDebounce.js
import { useState, useEffect } from 'react';

// Đây là một "Custom Hook"
// Nó nhận vào một "giá trị" (value) thay đổi liên tục
// và một "thời gian chờ" (delay)
function useDebounce(value, delay) {
    // State để lưu giá trị "đã chờ"
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(
        () => {
            // Bắt đầu một "đồng hồ đếm ngược"
            const handler = setTimeout(() => {
                // Khi hết giờ, cập nhật giá trị
                setDebouncedValue(value);
            }, delay);

            // Quan trọng: Nếu "value" thay đổi (người dùng gõ tiếp)
            // thì "dọn dẹp" (clear) đồng hồ cũ và bắt đầu lại
            return () => {
                clearTimeout(handler);
            };
        },
        [value, delay] // Chỉ chạy lại nếu "value" hoặc "delay" thay đổi
    );

    // Trả về giá trị đã "chờ"
    return debouncedValue;
}

export default useDebounce;