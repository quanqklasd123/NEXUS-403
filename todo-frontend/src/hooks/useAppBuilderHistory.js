// src/hooks/useAppBuilderHistory.js
import { useState, useCallback, useEffect, useRef } from 'react';
import useDebounce from './useDebounce';

const MAX_HISTORY_SIZE = 50;

export const useAppBuilderHistory = (canvasItems) => {
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const isUndoRedoRef = useRef(false);
    
    // Debounce canvasItems để lưu history khi update (tránh lưu quá nhiều khi đang type)
    const debouncedCanvasItems = useDebounce(canvasItems, 500);

    // Hàm lưu history
    const saveToHistory = useCallback((items) => {
        // Deep copy của canvasItems
        const snapshot = JSON.parse(JSON.stringify(items));
        
        setHistory(prevHistory => {
            // Xóa các bước sau historyIndex (khi user làm action mới sau khi undo)
            const newHistory = prevHistory.slice(0, historyIndex + 1);
            
            // Thêm snapshot mới
            newHistory.push(snapshot);
            
            // Giới hạn history size
            if (newHistory.length > MAX_HISTORY_SIZE) {
                newHistory.shift(); // Xóa bước cũ nhất
                return newHistory;
            }
            
            return newHistory;
        });
        
        // Cập nhật historyIndex
        setHistoryIndex(prevIndex => {
            const newIndex = prevIndex + 1;
            // Nếu đã vượt quá maxHistorySize, giữ nguyên index
            return Math.min(newIndex, MAX_HISTORY_SIZE - 1);
        });
    }, [historyIndex]);

    // Hàm Undo
    const handleUndo = useCallback(() => {
        if (historyIndex > 0) {
            isUndoRedoRef.current = true; // Đánh dấu đang undo
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            
            // Lấy snapshot từ history hiện tại
            const snapshot = JSON.parse(JSON.stringify(history[newIndex]));
            
            // Reset flag sau một chút
            setTimeout(() => {
                isUndoRedoRef.current = false;
            }, 100);
            
            return snapshot; // Return snapshot để set vào canvasItems
        }
        return null;
    }, [historyIndex, history]);

    // Hàm Redo
    const handleRedo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            isUndoRedoRef.current = true; // Đánh dấu đang redo
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            
            // Lấy snapshot từ history hiện tại
            const snapshot = JSON.parse(JSON.stringify(history[newIndex]));
            
            // Reset flag sau một chút
            setTimeout(() => {
                isUndoRedoRef.current = false;
            }, 100);
            
            return snapshot; // Return snapshot để set vào canvasItems
        }
        return null;
    }, [historyIndex, history.length, history]);

    // Lưu history khi debouncedCanvasItems thay đổi (cho handleUpdateItem)
    useEffect(() => {
        // Chỉ lưu history nếu:
        // 1. Không phải đang undo/redo
        // 2. Có items trong canvas
        // 3. Đã có history ban đầu (historyIndex >= 0)
        if (!isUndoRedoRef.current && debouncedCanvasItems.length >= 0 && historyIndex >= 0) {
            // Kiểm tra xem có thay đổi thực sự không (so sánh với history hiện tại)
            const currentSnapshot = JSON.stringify(debouncedCanvasItems);
            const lastSnapshot = history[historyIndex] ? JSON.stringify(history[historyIndex]) : '';
            
            if (currentSnapshot !== lastSnapshot) {
                // Chỉ lưu nếu thay đổi thực sự (không phải do undo/redo)
                saveToHistory(debouncedCanvasItems);
            }
        }
    }, [debouncedCanvasItems, historyIndex, history, saveToHistory]);

    // Initialize history với snapshot đầu tiên
    const initializeHistory = useCallback((items) => {
        const snapshot = JSON.parse(JSON.stringify(items));
        setHistory([snapshot]);
        setHistoryIndex(0);
    }, []);

    return {
        history,
        historyIndex,
        saveToHistory,
        handleUndo,
        handleRedo,
        initializeHistory,
        canUndo: historyIndex > 0,
        canRedo: historyIndex < history.length - 1
    };
};

