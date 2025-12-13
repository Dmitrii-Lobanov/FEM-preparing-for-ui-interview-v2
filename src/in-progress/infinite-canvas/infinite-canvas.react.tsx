import { useRef, useState } from 'react';
import css from './infinite-canvas.module.css';

type ViewportState = {
    scale: number;
    x: number;
    y: number;
};

type ShapeType = 'stickerYellow' | 'stickerPink' | 'stickerBlue' | 'textNormal' | 'textHeading';

type Shape = {
    id: string;
    type: ShapeType;
    x: number;
    y: number;
    width: number;
    height: number;
    text?: string;
};

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se';

const WORLD_BOUNDS = { x: 0, y: 0, width: 1000, height: 1000 };
const MINIMAP_SIZE = 120;
const MIN_SHAPE_SIZE = 20;

let shapeIdCounter = 0;

export const InfiniteCanvas = () => {
    const [viewport, setViewport] = useState<ViewportState>({
        scale: 1,
        x: 0,
        y: 0,
    });
    const [shapes, setShapes] = useState<Shape[]>([]);
    const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
    const [editingShapeId, setEditingShapeId] = useState<string | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const isPanning = useRef(false);
    const lastMousePos = useRef({ x: 0, y: 0 });

    // Resize state
    const resizingRef = useRef<{
        shapeId: string;
        handle: ResizeHandle;
        startMouse: { x: number; y: number };
        startShape: { x: number; y: number; width: number; height: number };
    } | null>(null);

    // Drag (move) state
    const draggingRef = useRef<{
        shapeId: string;
        startMouse: { x: number; y: number };
        startPos: { x: number; y: number };
    } | null>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        // Deselect if clicking on empty area
        if (e.target === containerRef.current || (e.target as HTMLElement).classList.contains(css.transformLayer)) {
            setSelectedShapeId(null);
            isPanning.current = true;
            lastMousePos.current = { x: e.clientX, y: e.clientY };
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        // Handle resizing
        if (resizingRef.current && containerRef.current) {
            const { shapeId, handle, startMouse, startShape } = resizingRef.current;

            const deltaX = (e.clientX - startMouse.x) / viewport.scale;
            const deltaY = (e.clientY - startMouse.y) / viewport.scale;

            setShapes(prev => prev.map(shape => {
                if (shape.id !== shapeId) return shape;

                let newX = startShape.x;
                let newY = startShape.y;
                let newWidth = startShape.width;
                let newHeight = startShape.height;

                if (handle.includes('e')) {
                    newWidth = Math.max(MIN_SHAPE_SIZE, startShape.width + deltaX);
                }
                if (handle.includes('w')) {
                    newWidth = Math.max(MIN_SHAPE_SIZE, startShape.width - deltaX);
                    newX = startShape.x + startShape.width - newWidth;
                }
                if (handle.includes('s')) {
                    newHeight = Math.max(MIN_SHAPE_SIZE, startShape.height + deltaY);
                }
                if (handle.includes('n')) {
                    newHeight = Math.max(MIN_SHAPE_SIZE, startShape.height - deltaY);
                    newY = startShape.y + startShape.height - newHeight;
                }

                return { ...shape, x: newX, y: newY, width: newWidth, height: newHeight };
            }));
            return;
        }

        // Handle dragging (moving shape)
        if (draggingRef.current) {
            const { shapeId, startMouse, startPos } = draggingRef.current;
            const deltaX = (e.clientX - startMouse.x) / viewport.scale;
            const deltaY = (e.clientY - startMouse.y) / viewport.scale;

            setShapes(prev => prev.map(shape => {
                if (shape.id !== shapeId) return shape;
                return { ...shape, x: startPos.x + deltaX, y: startPos.y + deltaY };
            }));
            return;
        }

        // Handle panning
        if (!isPanning.current) return;

        const deltaX = e.clientX - lastMousePos.current.x;
        const deltaY = e.clientY - lastMousePos.current.y;

        setViewport(prev => ({
            ...prev,
            x: prev.x + deltaX,
            y: prev.y + deltaY,
        }));

        lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
        isPanning.current = false;
        resizingRef.current = null;
        draggingRef.current = null;
    };

    const handleMouseLeave = () => {
        isPanning.current = false;
        resizingRef.current = null;
        draggingRef.current = null;
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.stopPropagation();
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const zoomFactor = 0.1;
        const direction = e.deltaY > 0 ? -1 : 1;
        const newScale = Math.max(0.1, Math.min(10, viewport.scale * (1 + direction * zoomFactor)));

        const scaleRatio = newScale / viewport.scale;
        const newX = mouseX - (mouseX - viewport.x) * scaleRatio;
        const newY = mouseY - (mouseY - viewport.y) * scaleRatio;

        setViewport({
            scale: newScale,
            x: newX,
            y: newY,
        });
    };

    // Drag and drop from toolbar
    const handleDragStart = (e: React.DragEvent, shapeType: ShapeType) => {
        e.dataTransfer.setData('shapeType', shapeType);
        e.dataTransfer.effectAllowed = 'copy';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const shapeType = e.dataTransfer.getData('shapeType') as ShapeType;
        if (!shapeType || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        const worldX = (screenX - viewport.x) / viewport.scale;
        const worldY = (screenY - viewport.y) / viewport.scale;

        const isSticker = shapeType.startsWith('sticker');
        const isHeading = shapeType === 'textHeading';

        const newShape: Shape = {
            id: `shape-${shapeIdCounter++}`,
            type: shapeType,
            x: worldX - (isSticker ? 75 : 50),
            y: worldY - (isSticker ? 50 : 15),
            width: isSticker ? 150 : 100,
            height: isSticker ? 100 : (isHeading ? 40 : 30),
            text: isSticker ? 'Note...' : (isHeading ? 'Heading' : 'Text'),
        };

        setShapes(prev => [...prev, newShape]);
        setSelectedShapeId(newShape.id);
    };

    // Shape mousedown to start dragging
    const handleShapeMouseDown = (e: React.MouseEvent, shapeId: string) => {
        e.stopPropagation();
        setSelectedShapeId(shapeId);

        // Don't start dragging if we're editing
        if (editingShapeId === shapeId) return;

        const shape = shapes.find(s => s.id === shapeId);
        if (!shape) return;

        draggingRef.current = {
            shapeId,
            startMouse: { x: e.clientX, y: e.clientY },
            startPos: { x: shape.x, y: shape.y },
        };
    };

    // Double-click to edit
    const handleDoubleClick = (e: React.MouseEvent, shapeId: string) => {
        e.stopPropagation();
        setEditingShapeId(shapeId);
    };

    // Handle blur to exit editing and save text
    const handleTextBlur = (e: React.FocusEvent<HTMLDivElement>, shapeId: string) => {
        const newText = e.currentTarget.textContent || '';
        setShapes(prev => prev.map(shape =>
            shape.id === shapeId ? { ...shape, text: newText } : shape
        ));
        setEditingShapeId(null);
    };

    // Start resizing
    const handleResizeStart = (e: React.MouseEvent, shapeId: string, handle: ResizeHandle) => {
        e.stopPropagation();
        const shape = shapes.find(s => s.id === shapeId);
        if (!shape) return;

        resizingRef.current = {
            shapeId,
            handle,
            startMouse: { x: e.clientX, y: e.clientY },
            startShape: { x: shape.x, y: shape.y, width: shape.width, height: shape.height },
        };
    };

    // Minimap click to navigate
    const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;
        const containerRect = containerRef.current.getBoundingClientRect();
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        const minimapScale = MINIMAP_SIZE / WORLD_BOUNDS.width;
        const worldX = clickX / minimapScale;
        const worldY = clickY / minimapScale;

        setViewport(prev => ({
            ...prev,
            x: containerRect.width / 2 - worldX * prev.scale,
            y: containerRect.height / 2 - worldY * prev.scale,
        }));
    };

    // Minimap calculations
    const minimapScale = MINIMAP_SIZE / WORLD_BOUNDS.width;
    const containerWidth = containerRef.current?.clientWidth ?? 500;
    const containerHeight = containerRef.current?.clientHeight ?? 500;
    const visibleWorldX = -viewport.x / viewport.scale;
    const visibleWorldY = -viewport.y / viewport.scale;
    const visibleWorldW = containerWidth / viewport.scale;
    const visibleWorldH = containerHeight / viewport.scale;

    const viewportIndicator = {
        left: visibleWorldX * minimapScale,
        top: visibleWorldY * minimapScale,
        width: visibleWorldW * minimapScale,
        height: visibleWorldH * minimapScale,
    };

    const getShapeClass = (type: ShapeType) => {
        switch (type) {
            case 'stickerYellow': return css.stickerYellow;
            case 'stickerPink': return css.stickerPink;
            case 'stickerBlue': return css.stickerBlue;
            case 'textNormal': return css.textNormal;
            case 'textHeading': return css.textHeading;
        }
    };

    // Get font size based on shape type (in world units)
    const getBaseFontSize = (type: ShapeType) => {
        switch (type) {
            case 'textHeading': return 24;
            case 'textNormal': return 14;
            default: return 12; // stickers
        }
    };

    const renderResizeHandles = (shapeId: string) => (
        <>
            <div className={`${css.resizeHandle} ${css.nw}`} onMouseDown={(e) => handleResizeStart(e, shapeId, 'nw')} />
            <div className={`${css.resizeHandle} ${css.ne}`} onMouseDown={(e) => handleResizeStart(e, shapeId, 'ne')} />
            <div className={`${css.resizeHandle} ${css.sw}`} onMouseDown={(e) => handleResizeStart(e, shapeId, 'sw')} />
            <div className={`${css.resizeHandle} ${css.se}`} onMouseDown={(e) => handleResizeStart(e, shapeId, 'se')} />
        </>
    );

    return (
        <div
            ref={containerRef}
            className={css.container}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onWheel={handleWheel}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            {/* Transform Layer - no CSS scale, only translate */}
            <div
                className={css.transformLayer}
                style={{
                    transform: `translate(${viewport.x}px, ${viewport.y}px)`,
                }}
            >
                {/* Dynamic Shapes - positions and sizes scaled */}
                {shapes.map(shape => {
                    const screenX = shape.x * viewport.scale;
                    const screenY = shape.y * viewport.scale;
                    const screenWidth = shape.width * viewport.scale;
                    const screenHeight = shape.height * viewport.scale;
                    const fontSize = getBaseFontSize(shape.type) * viewport.scale;

                    return (
                        <div
                            key={shape.id}
                            className={`${css.shape} ${getShapeClass(shape.type)} ${selectedShapeId === shape.id ? css.shapeSelected : ''}`}
                            style={{
                                left: screenX,
                                top: screenY,
                                width: screenWidth,
                                height: screenHeight,
                                fontSize: fontSize,
                                padding: 12 * viewport.scale,
                            }}
                            onMouseDown={(e) => handleShapeMouseDown(e, shape.id)}
                            onDoubleClick={(e) => handleDoubleClick(e, shape.id)}
                        >
                            <div
                                contentEditable={editingShapeId === shape.id}
                                suppressContentEditableWarning
                                onBlur={(e) => handleTextBlur(e, shape.id)}
                                style={{
                                    outline: 'none',
                                    width: '100%',
                                    height: '100%',
                                    whiteSpace: 'pre-wrap',
                                    wordWrap: 'break-word',
                                    overflow: 'hidden',
                                    cursor: editingShapeId === shape.id ? 'text' : 'inherit',
                                }}
                            >
                                {shape.text}
                            </div>
                            {selectedShapeId === shape.id && renderResizeHandles(shape.id)}
                        </div>
                    );
                })}
            </div>

            {/* Toolbar */}
            <div className={css.toolbar}>
                <div
                    className={css.toolbarItem}
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'stickerYellow')}
                    title="Yellow Sticker"
                >
                    <div style={{ width: 18, height: 14, background: '#fffbe6', border: '1px solid #fadb14', borderRadius: 2 }} />
                </div>
                <div
                    className={css.toolbarItem}
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'stickerPink')}
                    title="Pink Sticker"
                >
                    <div style={{ width: 18, height: 14, background: '#fff0f6', border: '1px solid #eb2f96', borderRadius: 2 }} />
                </div>
                <div
                    className={css.toolbarItem}
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'stickerBlue')}
                    title="Blue Sticker"
                >
                    <div style={{ width: 18, height: 14, background: '#e6f7ff', border: '1px solid #1890ff', borderRadius: 2 }} />
                </div>
                <div style={{ width: 1, height: 24, background: '#ddd', margin: '0 4px' }} />
                <div
                    className={css.toolbarItem}
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'textNormal')}
                    title="Normal Text"
                >
                    <span style={{ fontSize: 12, fontWeight: 'normal' }}>T</span>
                </div>
                <div
                    className={css.toolbarItem}
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'textHeading')}
                    title="Heading Text"
                >
                    <span style={{ fontSize: 16, fontWeight: 'bold' }}>H</span>
                </div>
            </div>

            {/* Minimap */}
            <div className={css.minimap} onClick={handleMinimapClick}>
                <div
                    className={css.minimapContent}
                    style={{ transform: `scale(${minimapScale})` }}
                >
                    {shapes.map(shape => (
                        <div
                            key={shape.id}
                            style={{
                                position: 'absolute',
                                left: shape.x,
                                top: shape.y,
                                width: shape.width,
                                height: shape.height,
                                background: shape.type === 'stickerYellow' ? '#fadb14' :
                                    shape.type === 'stickerPink' ? '#eb2f96' :
                                        shape.type === 'stickerBlue' ? '#1890ff' : '#333',
                                borderRadius: '2px',
                            }}
                        />
                    ))}
                </div>

                {/* Viewport indicator */}
                <div
                    className={css.minimapViewport}
                    style={{
                        left: viewportIndicator.left,
                        top: viewportIndicator.top,
                        width: viewportIndicator.width,
                        height: viewportIndicator.height,
                    }}
                />
            </div>

            {/* Debug Info */}
            <div className={css.debugInfo}>
                Scale: {viewport.scale.toFixed(2)} | Shapes: {shapes.length}
            </div>
        </div>
    );
};
